import { randomBytes } from "node:crypto";

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

import type { CourseModuleDto } from "./dto/replace-modules.dto";
import type { UpsertCourseDto } from "./dto/upsert-course.dto";

@Injectable()
export class LmsService {
  /**
   * Aggregate across every quiz in the course needed for a certificate.
   * Lives here rather than in QuizService because QuizService imports this
   * one, and the certificate rule belongs with the thing that issues it.
   */
  static readonly PASS_PERCENT = 80;

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  listPublished() {
    return this.prisma.course.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Course detail for the public catalogue — the syllabus someone reads
   * before deciding to buy.
   *
   * Module titles and ordering are the selling point and are meant to be
   * visible; videoAssetId is not. That's the Cloudflare Stream UID, which is
   * sufficient to play the video, so returning it to a visitor who hasn't
   * enrolled would give away the course itself.
   */
  async getPublishedCourse(courseId: string) {
    const course = await this.prisma.course.findFirst({
      where: { id: courseId, status: "PUBLISHED" },
      include: {
        modules: {
          select: { id: true, title: true, order: true },
          orderBy: { order: "asc" },
        },
      },
    });
    if (!course) throw new NotFoundException("COURSE_NOT_FOUND");
    return course;
  }

  /** Every status, with module counts — the admin course list. */
  listAll() {
    return this.prisma.course.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { modules: true, enrollments: true } } },
    });
  }

  async getById(courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: { modules: { orderBy: { order: "asc" } } },
    });
    if (!course) throw new NotFoundException("COURSE_NOT_FOUND");
    return course;
  }

  async upsertCourse(
    dto: UpsertCourseDto,
    actorUserId: string,
    courseId?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      if (courseId) {
        const existing = await tx.course.findUnique({
          where: { id: courseId },
        });
        if (!existing) throw new NotFoundException("COURSE_NOT_FOUND");

        const updated = await tx.course.update({
          where: { id: courseId },
          data: dto,
        });

        await this.audit.recordWith(tx, {
          actorUserId,
          action: AuditAction.COURSE_UPDATED,
          targetType: AuditTargetType.COURSE,
          targetId: updated.id,
          metadata: {
            title: updated.title,
            statusFrom: existing.status,
            statusTo: updated.status,
            // Access duration changes only affect enrolments created after
            // them — existing rows carry an already-computed expiresAt — so
            // record the change to make that visible during a dispute.
            accessDurationFrom: existing.accessDurationDays,
            accessDurationTo: updated.accessDurationDays,
          },
        });

        return updated;
      }

      const created = await tx.course.create({ data: dto });

      await this.audit.recordWith(tx, {
        actorUserId,
        action: AuditAction.COURSE_CREATED,
        targetType: AuditTargetType.COURSE,
        targetId: created.id,
        metadata: { title: created.title, status: created.status },
      });

      return created;
    });
  }

  /**
   * Replaces the module list wholesale (see ReplaceModulesDto for why).
   * Rejects duplicate positions: `order` drives playback sequence, and two
   * modules sharing a position would order non-deterministically.
   */
  async replaceModules(
    courseId: string,
    modules: CourseModuleDto[],
    actorUserId: string,
  ) {
    const positions = modules.map((m) => m.order);
    if (new Set(positions).size !== positions.length) {
      throw new BadRequestException("DUPLICATE_MODULE_ORDER");
    }

    return this.prisma.$transaction(async (tx) => {
      const course = await tx.course.findUnique({ where: { id: courseId } });
      if (!course) throw new NotFoundException("COURSE_NOT_FOUND");

      await tx.courseModule.deleteMany({ where: { courseId } });
      if (modules.length > 0) {
        await tx.courseModule.createMany({
          data: modules.map((m) => ({ ...m, courseId })),
        });
      }

      await this.audit.recordWith(tx, {
        actorUserId,
        action: AuditAction.COURSE_MODULES_REPLACED,
        targetType: AuditTargetType.COURSE,
        targetId: courseId,
        metadata: { moduleCount: modules.length },
      });

      return tx.courseModule.findMany({
        where: { courseId },
        orderBy: { order: "asc" },
      });
    });
  }

  /** Called by PaymentsService once a course order is confirmed paid. */
  async enroll(userId: string, courseId: string, orderId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course) throw new NotFoundException("COURSE_NOT_FOUND");

    return this.prisma.enrollment.create({
      data: {
        userId,
        courseId,
        orderId,
        expiresAt: new Date(
          Date.now() + course.accessDurationDays * 24 * 60 * 60 * 1000,
        ),
      },
    });
  }

  listMyEnrollments(userId: string) {
    return this.prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: { include: { _count: { select: { modules: true } } } },
        certificate: true,
        // Ids only: enough for the UI to tick off finished lessons and show a
        // count, without shipping a row per module per enrolment.
        progress: { select: { moduleId: true } },
      },
      orderBy: { enrolledAt: "desc" },
    });
  }

  /**
   * Confirmed policy (docs/srs.md Section 7, item 2): after the 6-month
   * window, the customer keeps the certificate but loses video access —
   * enforced here by checking expiresAt before allowing content access, NOT
   * by revoking the Enrollment or Certificate rows themselves.
   */
  async assertVideoAccess(enrollmentId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
    });
    if (!enrollment) throw new NotFoundException("ENROLLMENT_NOT_FOUND");
    return enrollment.expiresAt > new Date();
  }

  /**
   * Records that a learner finished one module, and issues the certificate
   * once every module in the course has been finished.
   *
   * Completion is derived here rather than accepted from the client. The
   * previous endpoint took an enrolment id and marked it complete with no
   * ownership check at all, which meant any signed-in user could mint a
   * certificate — their own the moment they enrolled, or someone else's given
   * that enrolment's id. A certificate is the thing the public verification
   * page vouches for to an employer, so the caller must own the enrolment,
   * the enrolment must still be live, and the module must belong to the
   * course being certified.
   *
   * KNOWN LIMIT: whether the learner actually watched anything is still the
   * client's word. Only Cloudflare Stream's playback events can establish
   * that, and Stream isn't provisioned yet — so this endpoint should be
   * driven by those events, not by a "mark as watched" button. Logged in
   * docs/TECH_DEBT.md.
   */
  async completeModule(enrollmentId: string, moduleId: string, userId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        course: { include: { modules: { select: { id: true } } } },
        certificate: true,
      },
    });
    if (!enrollment) throw new NotFoundException("ENROLLMENT_NOT_FOUND");

    // Same error for "not yours" as for "doesn't exist" would be tidier, but
    // these ids only ever come from the caller's own enrolment list, so a
    // distinct code is more useful than the marginal privacy gain.
    if (enrollment.userId !== userId) {
      throw new ForbiddenException("NOT_YOUR_ENROLLMENT");
    }
    if (enrollment.expiresAt <= new Date()) {
      // Past the access window there is nothing left to watch, so there is
      // nothing legitimate left to complete (docs/srs.md 7.2).
      throw new ForbiddenException("ACCESS_EXPIRED");
    }

    const moduleIds = enrollment.course.modules.map((m) => m.id);
    if (!moduleIds.includes(moduleId)) {
      // Without this, progress on one course could be reported against
      // another course's enrolment and complete it.
      throw new NotFoundException("MODULE_NOT_IN_COURSE");
    }

    // Idempotent: playback events repeat, and a learner may rewatch.
    await this.prisma.moduleProgress.upsert({
      where: { enrollmentId_moduleId: { enrollmentId, moduleId } },
      create: { enrollmentId, moduleId },
      update: {},
    });

    // Watching the last video is no longer enough on its own — the quizzes
    // have to be sat and the aggregate has to clear the pass mark. Both paths
    // funnel through one place so they can't disagree about what "finished"
    // means.
    await this.evaluateCompletion(enrollmentId);
    return this.progressSummary(enrollmentId, moduleIds.length);
  }

  /**
   * The single definition of "this course is complete", called after a video
   * is finished and after a quiz is submitted.
   *
   * A certificate needs three things: every module watched, every module's
   * quiz sat at least once, and an aggregate of at least PASS_PERCENT across
   * those quizzes. Retakes are unlimited and the best attempt at each quiz is
   * what counts, so someone who scores badly can lift their average rather
   * than being locked out of a course they paid for.
   *
   * Safe to call repeatedly: issuing is an atomic claim, so a learner who has
   * already been certified is left alone.
   */
  async evaluateCompletion(enrollmentId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        course: {
          include: {
            modules: { select: { id: true, quiz: { select: { id: true } } } },
          },
        },
      },
    });
    if (!enrollment || enrollment.completedAt) return null;

    const modules = enrollment.course.modules;
    // A course with no modules can't be completed — otherwise it would be
    // vacuously complete and issue a certificate for nothing.
    if (modules.length === 0) return null;

    const watched = await this.prisma.moduleProgress.count({
      where: { enrollmentId, moduleId: { in: modules.map((m) => m.id) } },
    });
    if (watched !== modules.length) return null;

    const quizIds = modules
      .map((m) => m.quiz?.id)
      .filter((id): id is string => Boolean(id));

    const assessment = await this.assessQuizzes(enrollmentId, quizIds);

    // "No quizzes" and "quizzes not sat yet" are different answers and must
    // not share a representation. Collapsing both to null once issued a
    // certificate at 50%: the last video was watched before the second test
    // had been taken, the aggregate was unknown, and unknown was read as
    // "nothing to fail".
    if (assessment.kind === "unsat") return null;
    if (
      assessment.kind === "scored" &&
      assessment.percent < LmsService.PASS_PERCENT
    ) {
      return null;
    }

    return this.issueCertificate(
      enrollmentId,
      assessment.kind === "scored" ? assessment.percent : null,
    );
  }

  /**
   * How the learner stands across a course's quizzes.
   *
   *   none   — the course has no quizzes, so the videos are the whole thing
   *   unsat  — at least one quiz has never been submitted; not a zero to
   *            average in, an incomplete course
   *   scored — every quiz sat, carrying the mean of the best attempt at each
   */
  private async assessQuizzes(
    enrollmentId: string,
    quizIds: string[],
  ): Promise<
    { kind: "none" } | { kind: "unsat" } | { kind: "scored"; percent: number }
  > {
    if (quizIds.length === 0) return { kind: "none" };

    const best = await this.prisma.quizAttempt.groupBy({
      by: ["quizId"],
      where: {
        enrollmentId,
        quizId: { in: quizIds },
        submittedAt: { not: null },
      },
      _max: { scorePercent: true },
    });

    if (best.length !== quizIds.length) return { kind: "unsat" };

    const total = best.reduce(
      (sum, row) => sum + (row._max.scorePercent ?? 0),
      0,
    );
    return { kind: "scored", percent: Math.round(total / quizIds.length) };
  }

  /** The number the progress rail shows, or null before every quiz is sat. */
  private async aggregateQuizScore(enrollmentId: string, quizIds: string[]) {
    const assessment = await this.assessQuizzes(enrollmentId, quizIds);
    return assessment.kind === "scored" ? assessment.percent : null;
  }

  /**
   * Claims completion and issues the certificate in one transaction.
   *
   * The conditional update is the atomic claim (docs/trd.md Section 4.3): two
   * concurrent "last module" reports would otherwise both see a finished
   * course and race to create a certificate, and only one can exist per
   * enrolment.
   */
  private async issueCertificate(
    enrollmentId: string,
    scorePercent: number | null,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const claimed = await tx.enrollment.updateMany({
        where: { id: enrollmentId, completedAt: null },
        data: { completedAt: new Date() },
      });
      if (claimed.count === 0) return null;

      return tx.certificate.create({
        data: {
          enrollmentId,
          verificationCode: randomBytes(8).toString("hex"),
          // Stored rather than recomputed on each verification: the score a
          // certificate was earned with shouldn't change because someone
          // later edited a quiz or moved the pass mark.
          scorePercent,
        },
      });
    });
  }

  private async progressSummary(enrollmentId: string, totalModules: number) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        certificate: true,
        progress: { select: { moduleId: true } },
      },
    });

    return {
      completedModuleIds: enrollment?.progress.map((p) => p.moduleId) ?? [],
      totalModules,
      completedAt: enrollment?.completedAt ?? null,
      certificate: enrollment?.certificate ?? null,
    };
  }

  /**
   * The gated lesson plan for one enrolment: what's unlocked, what's been
   * watched, what's been scored.
   *
   * Every gate is decided here rather than in the browser. The client uses
   * this to draw locks, but the endpoints behind each step re-check the same
   * conditions — a lock nobody can see is the only kind that holds.
   */
  async getLearnerOutline(enrollmentId: string, userId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        certificate: true,
        course: {
          include: {
            modules: {
              orderBy: { order: "asc" },
              include: {
                quiz: {
                  select: {
                    id: true,
                    title: true,
                    timeLimitSeconds: true,
                    _count: { select: { questions: true } },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!enrollment) throw new NotFoundException("ENROLLMENT_NOT_FOUND");
    if (enrollment.userId !== userId) {
      throw new ForbiddenException("NOT_YOUR_ENROLLMENT");
    }

    const hasVideoAccess = enrollment.expiresAt > new Date();

    const [progress, attempts] = await Promise.all([
      this.prisma.moduleProgress.findMany({
        where: { enrollmentId },
        select: { moduleId: true },
      }),
      this.prisma.quizAttempt.groupBy({
        by: ["quizId"],
        where: { enrollmentId, submittedAt: { not: null } },
        _max: { scorePercent: true },
        _count: { _all: true },
      }),
    ]);

    const watched = new Set(progress.map((p) => p.moduleId));
    const byQuiz = new Map(attempts.map((a) => [a.quizId, a]));

    // Walk in order, carrying whether everything before this point is done.
    // A module opens only once the previous one's video AND quiz are behind
    // you — that sequencing is the whole point of the feature.
    let previousFinished = true;
    const modules = enrollment.course.modules.map((courseModule) => {
      const videoCompleted = watched.has(courseModule.id);
      const stats = courseModule.quiz
        ? byQuiz.get(courseModule.quiz.id)
        : undefined;
      const attemptCount = stats?._count._all ?? 0;

      const unlocked = previousFinished;
      const finished =
        videoCompleted && (!courseModule.quiz || attemptCount > 0);
      previousFinished = previousFinished && finished;

      return {
        id: courseModule.id,
        title: courseModule.title,
        order: courseModule.order,
        // The Stream UID is enough to play the video, so it goes out only
        // while access is live — same rule as the public catalogue.
        videoAssetId: hasVideoAccess ? courseModule.videoAssetId : undefined,
        videoCompleted,
        unlocked,
        quiz: courseModule.quiz
          ? {
              id: courseModule.quiz.id,
              title: courseModule.quiz.title,
              questionCount: courseModule.quiz._count.questions,
              timeLimitSeconds: courseModule.quiz.timeLimitSeconds,
              attemptCount,
              bestScorePercent: stats?._max.scorePercent ?? null,
              // The gate the client draws a padlock for: no test until the
              // video is done. startAttempt enforces the same thing.
              unlocked: unlocked && videoCompleted,
            }
          : null,
      };
    });

    const quizIds = modules
      .map((m) => m.quiz?.id)
      .filter((id): id is string => Boolean(id));

    return {
      enrollmentId,
      courseId: enrollment.courseId,
      courseTitle: enrollment.course.title,
      enrolledAt: enrollment.enrolledAt,
      expiresAt: enrollment.expiresAt,
      hasVideoAccess,
      completedAt: enrollment.completedAt,
      certificate: enrollment.certificate,
      passMark: LmsService.PASS_PERCENT,
      aggregateScorePercent: await this.aggregateQuizScore(
        enrollmentId,
        quizIds,
      ),
      modules,
    };
  }

  /** Public endpoint (docs/srs.md Section 7, item 5) — no auth required. */
  async verifyCertificate(verificationCode: string) {
    const certificate = await this.prisma.certificate.findUnique({
      where: { verificationCode },
      include: {
        enrollment: {
          include: { course: true, user: { select: { name: true } } },
        },
      },
    });
    if (!certificate) return { valid: false };

    return {
      valid: true,
      courseTitle: certificate.enrollment.course.title,
      holderName: certificate.enrollment.user.name,
      issuedAt: certificate.issuedAt,
      // What the holder scored, so a verifier sees the same number printed on
      // the certificate they're holding.
      scorePercent: certificate.scorePercent,
      verificationCode: certificate.verificationCode,
    };
  }
}
