import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service";
import {
  AuditAction,
  AuditService,
  AuditTargetType,
} from "../audit/audit.service";

import type { UpsertQuizDto } from "./dto/upsert-quiz.dto";
import { LmsService } from "./lms.service";

/**
 * Timed, gated module quizzes.
 *
 * ── THE RULE THAT MATTERS ──────────────────────────────────────────────────
 * QuizOption.isCorrect must never reach a learner. Every learner-facing query
 * in this file selects option fields explicitly rather than including the
 * whole row, because `include: { options: true }` would ship the answer key to
 * the browser and make the entire assessment decorative. The one place it is
 * read is scoreAttempt, which runs on the server after submission.
 * ───────────────────────────────────────────────────────────────────────────
 *
 * The timer is server-authoritative for the same reason: QuizAttempt.expiresAt
 * is frozen at start from the quiz's limit, and answers saved after it are
 * refused. A countdown in the browser is a courtesy, not the enforcement.
 */
@Injectable()
export class QuizService {
  /** Option fields safe to send to someone taking the quiz. */
  private static readonly LEARNER_OPTION_FIELDS = {
    id: true,
    text: true,
    order: true,
  } as const;

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly lms: LmsService,
  ) {}

  /* ------------------------------------------------------------------ admin */

  /** Full quiz including the answer key. Staff-only — see LmsController. */
  async getQuizForAdmin(moduleId: string) {
    return this.prisma.quiz.findUnique({
      where: { moduleId },
      include: {
        questions: {
          orderBy: { order: "asc" },
          include: { options: { orderBy: { order: "asc" } } },
        },
      },
    });
  }

  /**
   * Replaces a module's quiz wholesale.
   *
   * Existing attempts are deliberately preserved: the cascade is on Quiz, and
   * this updates rather than deletes it, so a learner who already sat the test
   * keeps their recorded score. Their answers point at options that may no
   * longer exist, which is why QuizAnswer.selectedOptionId is SetNull rather
   * than Cascade — a re-edited quiz loses the detail of an old attempt, not
   * the score it produced.
   */
  async upsertQuiz(moduleId: string, dto: UpsertQuizDto, actorUserId: string) {
    // A question with no correct option can't be scored; one with several
    // can't be scored as single-choice. Both are silent disasters if they
    // reach a paying learner, so they're rejected at write time and scoring
    // downstream can then assume exactly one.
    dto.questions.forEach((question, index) => {
      const correct = question.options.filter((o) => o.isCorrect).length;
      if (correct !== 1) {
        throw new BadRequestException(
          `QUESTION_${index + 1}_NEEDS_EXACTLY_ONE_CORRECT_OPTION`,
        );
      }
    });

    return this.prisma.$transaction(async (tx) => {
      const courseModule = await tx.courseModule.findUnique({
        where: { id: moduleId },
      });
      if (!courseModule) throw new NotFoundException("MODULE_NOT_FOUND");

      const quiz = await tx.quiz.upsert({
        where: { moduleId },
        create: {
          moduleId,
          title: dto.title,
          timeLimitSeconds: dto.timeLimitSeconds,
        },
        update: { title: dto.title, timeLimitSeconds: dto.timeLimitSeconds },
      });

      // Questions are replaced, not diffed: the admin UI edits the whole list
      // at once, and matching rows by position would silently rewrite the
      // wrong question when one is inserted in the middle.
      await tx.quizQuestion.deleteMany({ where: { quizId: quiz.id } });

      for (const [order, question] of dto.questions.entries()) {
        await tx.quizQuestion.create({
          data: {
            quizId: quiz.id,
            prompt: question.prompt,
            order,
            options: {
              create: question.options.map((option, optionOrder) => ({
                text: option.text,
                order: optionOrder,
                isCorrect: option.isCorrect,
              })),
            },
          },
        });
      }

      await this.audit.recordWith(tx, {
        actorUserId,
        action: AuditAction.COURSE_MODULES_REPLACED,
        targetType: AuditTargetType.COURSE,
        targetId: courseModule.courseId,
        metadata: {
          moduleId,
          quizQuestionCount: dto.questions.length,
          timeLimitSeconds: dto.timeLimitSeconds,
        },
      });

      return quiz;
    });
  }

  async deleteQuiz(moduleId: string) {
    const quiz = await this.prisma.quiz.findUnique({ where: { moduleId } });
    if (!quiz) throw new NotFoundException("QUIZ_NOT_FOUND");
    await this.prisma.quiz.delete({ where: { moduleId } });
  }

  /* --------------------------------------------------------------- learner */

  /**
   * Starts or resumes an attempt.
   *
   * Resuming matters: a page refresh mid-quiz must not hand out a fresh timer,
   * and it must not lose the answers already saved. An expired-but-unsubmitted
   * attempt is finalised first, so an abandoned attempt scores what was
   * actually answered rather than sitting open forever.
   */
  async startAttempt(quizId: string, enrollmentId: string, userId: string) {
    const enrollment = await this.assertOwnedLiveEnrollment(
      enrollmentId,
      userId,
    );

    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: { module: true },
    });
    if (!quiz) throw new NotFoundException("QUIZ_NOT_FOUND");
    if (quiz.module.courseId !== enrollment.courseId) {
      // Without this, an enrolment in a cheap course could be used to sit the
      // quizzes of an expensive one.
      throw new NotFoundException("QUIZ_NOT_IN_COURSE");
    }

    // The gate the whole feature exists for: the video comes first.
    const watched = await this.prisma.moduleProgress.findUnique({
      where: {
        enrollmentId_moduleId: { enrollmentId, moduleId: quiz.moduleId },
      },
    });
    if (!watched) throw new ForbiddenException("MODULE_NOT_COMPLETED");

    const now = new Date();
    const open = await this.prisma.quizAttempt.findFirst({
      where: { quizId, enrollmentId, submittedAt: null },
      orderBy: { startedAt: "desc" },
    });

    if (open && open.expiresAt > now) {
      return this.attemptForLearner(open.id);
    }
    if (open) {
      await this.scoreAttempt(open.id);
    }

    const attempt = await this.prisma.quizAttempt.create({
      data: {
        quizId,
        enrollmentId,
        expiresAt: new Date(now.getTime() + quiz.timeLimitSeconds * 1000),
      },
    });

    return this.attemptForLearner(attempt.id);
  }

  /**
   * Saves one answer, refusing anything after the deadline.
   *
   * Answers are saved as the learner goes rather than posted in a batch at
   * the end, so a timer running out costs the unanswered questions and
   * nothing else. This is also what makes the deadline enforceable without
   * being cruel: submission stays open, but only what was saved in time counts.
   */
  async saveAnswer(
    attemptId: string,
    questionId: string,
    selectedOptionId: string | null,
    userId: string,
  ) {
    const attempt = await this.assertOwnedAttempt(attemptId, userId);
    if (attempt.submittedAt) throw new ForbiddenException("ATTEMPT_SUBMITTED");
    if (attempt.expiresAt <= new Date()) {
      throw new ForbiddenException("ATTEMPT_EXPIRED");
    }

    const question = await this.prisma.quizQuestion.findUnique({
      where: { id: questionId },
      include: { options: { select: { id: true } } },
    });
    if (!question || question.quizId !== attempt.quizId) {
      throw new NotFoundException("QUESTION_NOT_IN_QUIZ");
    }
    if (
      selectedOptionId &&
      !question.options.some((o) => o.id === selectedOptionId)
    ) {
      // An option id from another question would otherwise be stored and then
      // scored as wrong, quietly, instead of surfacing a broken client.
      throw new BadRequestException("OPTION_NOT_IN_QUESTION");
    }

    await this.prisma.quizAnswer.upsert({
      where: { attemptId_questionId: { attemptId, questionId } },
      create: { attemptId, questionId, selectedOptionId },
      update: { selectedOptionId },
    });

    return { saved: true };
  }

  async submitAttempt(attemptId: string, userId: string) {
    const attempt = await this.assertOwnedAttempt(attemptId, userId);
    if (attempt.submittedAt) {
      // Idempotent: a double-tap on submit returns the same result rather than
      // re-scoring or erroring.
      return this.attemptResult(attemptId);
    }

    await this.scoreAttempt(attemptId);
    // Submitting the last outstanding quiz can be what completes the course.
    await this.lms.evaluateCompletion(attempt.enrollmentId);
    return this.attemptResult(attemptId);
  }

  /**
   * Scores a submitted attempt. The only place isCorrect is read.
   *
   * Every question counts, answered or not — a blank is worth the same as a
   * wrong answer, which is what stops "skip the hard ones" from raising a
   * percentage.
   */
  private async scoreAttempt(attemptId: string) {
    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        answers: true,
        quiz: {
          include: {
            questions: {
              include: { options: { select: { id: true, isCorrect: true } } },
            },
          },
        },
      },
    });
    if (!attempt) throw new NotFoundException("ATTEMPT_NOT_FOUND");

    const questions = attempt.quiz.questions;
    const correct = questions.filter((question) => {
      const answer = attempt.answers.find((a) => a.questionId === question.id);
      if (!answer?.selectedOptionId) return false;
      return question.options.some(
        (o) => o.id === answer.selectedOptionId && o.isCorrect,
      );
    }).length;

    // A quiz can't be saved with zero questions, but a defensive guard here
    // costs nothing and avoids a division by zero if one ever exists.
    const scorePercent =
      questions.length === 0
        ? 0
        : Math.round((correct / questions.length) * 100);

    await this.prisma.quizAttempt.update({
      where: { id: attemptId },
      data: { submittedAt: new Date(), scorePercent },
    });

    return scorePercent;
  }

  /* --------------------------------------------------------------- reading */

  /** The attempt as the learner may see it: questions, no answer key. */
  private async attemptForLearner(attemptId: string) {
    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        answers: { select: { questionId: true, selectedOptionId: true } },
        quiz: {
          select: {
            id: true,
            title: true,
            timeLimitSeconds: true,
            moduleId: true,
            questions: {
              orderBy: { order: "asc" },
              select: {
                id: true,
                prompt: true,
                order: true,
                options: {
                  orderBy: { order: "asc" },
                  select: QuizService.LEARNER_OPTION_FIELDS,
                },
              },
            },
          },
        },
      },
    });
    if (!attempt) throw new NotFoundException("ATTEMPT_NOT_FOUND");

    return {
      id: attempt.id,
      quizId: attempt.quizId,
      moduleId: attempt.quiz.moduleId,
      title: attempt.quiz.title,
      // The client counts down from this rather than from a duration it was
      // handed, so a clock that drifts can't extend the attempt.
      expiresAt: attempt.expiresAt,
      submittedAt: attempt.submittedAt,
      questions: attempt.quiz.questions,
      answers: attempt.answers,
    };
  }

  /**
   * The result screen. Includes which option was right, because by now the
   * attempt is submitted and telling someone what they got wrong is the point
   * of an assessment.
   */
  private async attemptResult(attemptId: string) {
    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        answers: { select: { questionId: true, selectedOptionId: true } },
        quiz: {
          select: {
            id: true,
            moduleId: true,
            questions: {
              orderBy: { order: "asc" },
              select: {
                id: true,
                prompt: true,
                order: true,
                options: {
                  orderBy: { order: "asc" },
                  select: {
                    id: true,
                    text: true,
                    order: true,
                    isCorrect: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!attempt) throw new NotFoundException("ATTEMPT_NOT_FOUND");

    return {
      id: attempt.id,
      quizId: attempt.quizId,
      moduleId: attempt.quiz.moduleId,
      scorePercent: attempt.scorePercent ?? 0,
      passMark: LmsService.PASS_PERCENT,
      submittedAt: attempt.submittedAt,
      questions: attempt.quiz.questions,
      answers: attempt.answers,
    };
  }

  /* ----------------------------------------------------------------- guards */

  private async assertOwnedLiveEnrollment(
    enrollmentId: string,
    userId: string,
  ) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
    });
    if (!enrollment) throw new NotFoundException("ENROLLMENT_NOT_FOUND");
    if (enrollment.userId !== userId) {
      throw new ForbiddenException("NOT_YOUR_ENROLLMENT");
    }
    if (enrollment.expiresAt <= new Date()) {
      throw new ForbiddenException("ACCESS_EXPIRED");
    }
    return enrollment;
  }

  private async assertOwnedAttempt(attemptId: string, userId: string) {
    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: { enrollment: { select: { userId: true } } },
    });
    if (!attempt) throw new NotFoundException("ATTEMPT_NOT_FOUND");
    if (attempt.enrollment.userId !== userId) {
      // The id is a uuid nobody else can guess, but guessing isn't the threat
      // model — a shared or leaked link is, and this is what makes one useless.
      throw new ForbiddenException("NOT_YOUR_ATTEMPT");
    }
    return attempt;
  }
}
