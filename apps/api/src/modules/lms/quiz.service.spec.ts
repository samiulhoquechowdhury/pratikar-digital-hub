import { BadRequestException, ForbiddenException } from "@nestjs/common";

import type { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";

import type { UpsertQuizDto } from "./dto/upsert-quiz.dto";
import { LmsService } from "./lms.service";
import { QuizService } from "./quiz.service";

/**
 * A quiz gates a certificate, and the certificate is what the public
 * verification page vouches for to an employer. That makes three things
 * correctness problems rather than polish:
 *
 *   1. The answer key must never reach the browser. If it does, the
 *      assessment is decorative and every certificate is worthless.
 *   2. The timer must be the server's. A countdown the client owns is a
 *      suggestion.
 *   3. The gates must hold on the endpoint, not just in the UI. A padlock
 *      drawn in React stops nobody.
 */
describe("QuizService", () => {
  const NOW = new Date("2026-08-01T10:00:00Z");
  const LIVE_ENROLLMENT = {
    id: "e-1",
    userId: "u-1",
    courseId: "c-1",
    expiresAt: new Date("2026-12-01T00:00:00Z"),
  };

  const buildPrisma = () => ({
    enrollment: { findUnique: jest.fn().mockResolvedValue(LIVE_ENROLLMENT) },
    quiz: { findUnique: jest.fn(), upsert: jest.fn(), delete: jest.fn() },
    quizQuestion: {
      findUnique: jest.fn(),
      deleteMany: jest.fn(),
      create: jest.fn(),
    },
    quizAttempt: {
      findFirst: jest.fn().mockResolvedValue(null),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    quizAnswer: { upsert: jest.fn() },
    moduleProgress: { findUnique: jest.fn().mockResolvedValue({ id: "mp-1" }) },
    courseModule: { findUnique: jest.fn() },
    auditLog: { create: jest.fn() },
    $transaction: jest.fn(),
  });

  type Prisma = ReturnType<typeof buildPrisma>;

  const buildService = (prisma: Prisma) => {
    const lms = { evaluateCompletion: jest.fn() };
    const service = new QuizService(
      prisma as unknown as PrismaService,
      new AuditService(prisma as unknown as PrismaService),
      lms as unknown as LmsService,
    );
    return { service, lms };
  };

  /** A two-question quiz whose right answers are option "a1" and "b1". */
  const quizWithAnswers = {
    id: "q-1",
    moduleId: "m-1",
    timeLimitSeconds: 600,
    module: { id: "m-1", courseId: "c-1" },
    questions: [
      {
        id: "qq-1",
        options: [
          { id: "a1", isCorrect: true },
          { id: "a2", isCorrect: false },
        ],
      },
      {
        id: "qq-2",
        options: [
          { id: "b1", isCorrect: true },
          { id: "b2", isCorrect: false },
        ],
      },
    ],
  };

  beforeAll(() => jest.useFakeTimers().setSystemTime(NOW));
  afterAll(() => jest.useRealTimers());
  afterEach(() => jest.clearAllMocks());

  /* ------------------------------------------------------- the answer key */

  /**
   * The single most important test here. `include: { options: true }` on any
   * learner-facing query would ship isCorrect to the browser, where anyone
   * can read it out of the network tab and score 100% forever.
   */
  it("never sends isCorrect to someone taking the quiz", async () => {
    const prisma = buildPrisma();
    prisma.quiz.findUnique.mockResolvedValue(quizWithAnswers);
    prisma.quizAttempt.create.mockResolvedValue({ id: "a-1" });
    prisma.quizAttempt.findUnique.mockResolvedValue({
      id: "a-1",
      quizId: "q-1",
      expiresAt: new Date(NOW.getTime() + 600_000),
      submittedAt: null,
      answers: [],
      quiz: {
        id: "q-1",
        moduleId: "m-1",
        title: null,
        timeLimitSeconds: 600,
        questions: [
          {
            id: "qq-1",
            prompt: "?",
            order: 0,
            options: [{ id: "a1", text: "A", order: 0 }],
          },
        ],
      },
    });

    const attempt = await buildService(prisma).service.startAttempt(
      "q-1",
      "e-1",
      "u-1",
    );

    expect(JSON.stringify(attempt)).not.toContain("isCorrect");

    // And the query that produced it must have asked for named fields rather
    // than the whole option row — this is what stops a future edit reopening
    // the leak.
    const calls = prisma.quizAttempt.findUnique.mock.calls as unknown[][];
    expect(JSON.stringify(calls[0]?.[0])).not.toContain("isCorrect");
  });

  /* ------------------------------------------------------------- the gate */

  it("refuses to start the test until the module's video is done", async () => {
    const prisma = buildPrisma();
    prisma.quiz.findUnique.mockResolvedValue(quizWithAnswers);
    prisma.moduleProgress.findUnique.mockResolvedValue(null);

    await expect(
      buildService(prisma).service.startAttempt("q-1", "e-1", "u-1"),
    ).rejects.toThrow("MODULE_NOT_COMPLETED");
    expect(prisma.quizAttempt.create).not.toHaveBeenCalled();
  });

  /** An enrolment in a cheap course must not open an expensive one's tests. */
  it("refuses a quiz belonging to a different course", async () => {
    const prisma = buildPrisma();
    prisma.quiz.findUnique.mockResolvedValue({
      ...quizWithAnswers,
      module: { id: "m-9", courseId: "OTHER-COURSE" },
    });

    await expect(
      buildService(prisma).service.startAttempt("q-1", "e-1", "u-1"),
    ).rejects.toThrow("QUIZ_NOT_IN_COURSE");
  });

  it("refuses someone else's enrolment", async () => {
    const prisma = buildPrisma();
    prisma.enrollment.findUnique.mockResolvedValue({
      ...LIVE_ENROLLMENT,
      userId: "SOMEBODY-ELSE",
    });

    await expect(
      buildService(prisma).service.startAttempt("q-1", "e-1", "u-1"),
    ).rejects.toThrow("NOT_YOUR_ENROLLMENT");
  });

  it("refuses an enrolment whose access window has closed", async () => {
    const prisma = buildPrisma();
    prisma.enrollment.findUnique.mockResolvedValue({
      ...LIVE_ENROLLMENT,
      expiresAt: new Date("2026-01-01T00:00:00Z"),
    });

    await expect(
      buildService(prisma).service.startAttempt("q-1", "e-1", "u-1"),
    ).rejects.toThrow("ACCESS_EXPIRED");
  });

  /* ----------------------------------------------------------- the timer */

  /**
   * A refresh mid-quiz must resume, not restart. Handing out a fresh
   * expiresAt would make the time limit unenforceable by pressing F5.
   */
  it("resumes an attempt that is still running instead of granting a new timer", async () => {
    const prisma = buildPrisma();
    prisma.quiz.findUnique.mockResolvedValue(quizWithAnswers);
    prisma.quizAttempt.findFirst.mockResolvedValue({
      id: "a-open",
      expiresAt: new Date(NOW.getTime() + 60_000),
      submittedAt: null,
    });
    prisma.quizAttempt.findUnique.mockResolvedValue({
      id: "a-open",
      quizId: "q-1",
      expiresAt: new Date(NOW.getTime() + 60_000),
      submittedAt: null,
      answers: [],
      quiz: { id: "q-1", moduleId: "m-1", title: null, questions: [] },
    });

    const attempt = await buildService(prisma).service.startAttempt(
      "q-1",
      "e-1",
      "u-1",
    );

    expect(attempt.id).toBe("a-open");
    expect(prisma.quizAttempt.create).not.toHaveBeenCalled();
  });

  it("freezes the deadline from the quiz's limit at the moment it starts", async () => {
    const prisma = buildPrisma();
    prisma.quiz.findUnique.mockResolvedValue(quizWithAnswers);
    prisma.quizAttempt.create.mockResolvedValue({ id: "a-1" });
    prisma.quizAttempt.findUnique.mockResolvedValue({
      id: "a-1",
      quizId: "q-1",
      expiresAt: NOW,
      submittedAt: null,
      answers: [],
      quiz: { id: "q-1", moduleId: "m-1", title: null, questions: [] },
    });

    await buildService(prisma).service.startAttempt("q-1", "e-1", "u-1");

    expect(prisma.quizAttempt.create).toHaveBeenCalledWith({
      data: {
        quizId: "q-1",
        enrollmentId: "e-1",
        expiresAt: new Date(NOW.getTime() + 600 * 1000),
      },
    });
  });

  /** The deadline's teeth: after it, nothing more can be recorded. */
  it("rejects an answer saved after the deadline", async () => {
    const prisma = buildPrisma();
    prisma.quizAttempt.findUnique.mockResolvedValue({
      id: "a-1",
      quizId: "q-1",
      expiresAt: new Date(NOW.getTime() - 1000),
      submittedAt: null,
      enrollment: { userId: "u-1" },
    });

    await expect(
      buildService(prisma).service.saveAnswer("a-1", "qq-1", "a1", "u-1"),
    ).rejects.toThrow("ATTEMPT_EXPIRED");
    expect(prisma.quizAnswer.upsert).not.toHaveBeenCalled();
  });

  it("rejects an answer on someone else's attempt", async () => {
    const prisma = buildPrisma();
    prisma.quizAttempt.findUnique.mockResolvedValue({
      id: "a-1",
      quizId: "q-1",
      expiresAt: new Date(NOW.getTime() + 60_000),
      submittedAt: null,
      enrollment: { userId: "SOMEBODY-ELSE" },
    });

    await expect(
      buildService(prisma).service.saveAnswer("a-1", "qq-1", "a1", "u-1"),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("rejects an option that belongs to a different question", async () => {
    const prisma = buildPrisma();
    prisma.quizAttempt.findUnique.mockResolvedValue({
      id: "a-1",
      quizId: "q-1",
      expiresAt: new Date(NOW.getTime() + 60_000),
      submittedAt: null,
      enrollment: { userId: "u-1" },
    });
    prisma.quizQuestion.findUnique.mockResolvedValue({
      id: "qq-1",
      quizId: "q-1",
      options: [{ id: "a1" }, { id: "a2" }],
    });

    await expect(
      buildService(prisma).service.saveAnswer("a-1", "qq-1", "b1", "u-1"),
    ).rejects.toThrow("OPTION_NOT_IN_QUESTION");
  });

  /* ---------------------------------------------------------- the scoring */

  /**
   * Reads the score written back to the attempt. Goes through the recorded
   * call rather than expect.objectContaining, which is typed `any` and so
   * can't be passed to a matcher without tripping no-unsafe-assignment.
   */
  const scoreWrittenBy = (prisma: Prisma): number | undefined => {
    const calls = prisma.quizAttempt.update.mock.calls as {
      data?: { scorePercent?: number };
    }[][];
    return calls[0]?.[0]?.data?.scorePercent;
  };

  const submittedAttempt = (
    answers: { questionId: string; selectedOptionId: string | null }[],
  ) => ({
    id: "a-1",
    quizId: "q-1",
    enrollmentId: "e-1",
    submittedAt: null,
    enrollment: { userId: "u-1" },
    answers,
    quiz: quizWithAnswers,
  });

  // Object form rather than a positional tuple: with `%s`/`%i` the
  // placeholders map to array elements in order, so the score printed in the
  // test name was the answers array rendered as a number — every case read
  // "as NaN%" while still asserting correctly.
  it.each([
    {
      label: "both right",
      answers: [
        { questionId: "qq-1", selectedOptionId: "a1" },
        { questionId: "qq-2", selectedOptionId: "b1" },
      ],
      expected: 100,
    },
    {
      label: "one right",
      answers: [
        { questionId: "qq-1", selectedOptionId: "a1" },
        { questionId: "qq-2", selectedOptionId: "b2" },
      ],
      expected: 50,
    },
    {
      label: "both wrong",
      answers: [{ questionId: "qq-1", selectedOptionId: "a2" }],
      expected: 0,
    },
  ])("scores $label as $expected%", async ({ answers, expected }) => {
    const prisma = buildPrisma();
    prisma.quizAttempt.findUnique.mockResolvedValue(submittedAttempt(answers));

    await buildService(prisma).service.submitAttempt("a-1", "u-1");

    expect(scoreWrittenBy(prisma)).toBe(expected);
  });

  /**
   * A blank counts as wrong rather than being dropped from the denominator.
   * Otherwise skipping every hard question would raise the percentage, and
   * answering one question correctly would score 100%.
   */
  it("counts an unanswered question as wrong, not as absent", async () => {
    const prisma = buildPrisma();
    prisma.quizAttempt.findUnique.mockResolvedValue(
      submittedAttempt([{ questionId: "qq-1", selectedOptionId: "a1" }]),
    );

    await buildService(prisma).service.submitAttempt("a-1", "u-1");

    expect(scoreWrittenBy(prisma)).toBe(50);
  });

  it("re-checks the course after a submission, since it may complete it", async () => {
    const prisma = buildPrisma();
    prisma.quizAttempt.findUnique.mockResolvedValue(
      submittedAttempt([{ questionId: "qq-1", selectedOptionId: "a1" }]),
    );

    const { service, lms } = buildService(prisma);
    await service.submitAttempt("a-1", "u-1");

    expect(lms.evaluateCompletion).toHaveBeenCalledWith("e-1");
  });

  /** A double-tap on submit must not re-score or error. */
  it("is idempotent when submitted twice", async () => {
    const prisma = buildPrisma();
    prisma.quizAttempt.findUnique.mockResolvedValue({
      ...submittedAttempt([]),
      submittedAt: NOW,
      scorePercent: 70,
      quiz: { ...quizWithAnswers, questions: [] },
    });

    await buildService(prisma).service.submitAttempt("a-1", "u-1");

    expect(prisma.quizAttempt.update).not.toHaveBeenCalled();
  });

  /* --------------------------------------------------------- quiz authoring */

  const validQuiz: UpsertQuizDto = {
    timeLimitSeconds: 600,
    questions: [
      {
        prompt: "Which form?",
        options: [
          { text: "GSTR-1", isCorrect: true },
          { text: "GSTR-9", isCorrect: false },
        ],
      },
    ],
  };

  /**
   * A question with no correct option is unscoreable and one with two is
   * unscoreable as single-choice. Either would silently deny certificates to
   * learners who answered as well as anyone could.
   */
  it.each([
    ["no correct option", false, false],
    ["two correct options", true, true],
  ])("refuses to save a question with %s", async (_label, first, second) => {
    const prisma = buildPrisma();
    prisma.$transaction.mockImplementation(() => {
      throw new Error("should not reach the transaction");
    });

    await expect(
      buildService(prisma).service.upsertQuiz(
        "m-1",
        {
          ...validQuiz,
          questions: [
            {
              prompt: "?",
              options: [
                { text: "A", isCorrect: first },
                { text: "B", isCorrect: second },
              ],
            },
          ],
        },
        "cm-1",
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("names the offending question so an admin can find it", async () => {
    const prisma = buildPrisma();

    await expect(
      buildService(prisma).service.upsertQuiz(
        "m-1",
        {
          ...validQuiz,
          questions: [
            validQuiz.questions[0]!,
            {
              prompt: "broken",
              options: [
                { text: "A", isCorrect: false },
                { text: "B", isCorrect: false },
              ],
            },
          ],
        },
        "cm-1",
      ),
    ).rejects.toThrow("QUESTION_2_NEEDS_EXACTLY_ONE_CORRECT_OPTION");
  });
});
