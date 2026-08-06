// Module quizzes: the timed test a learner sits after each video, and the
// gating that decides what they can reach next.
//
// Two shapes exist for an option on purpose. `QuizOptionForLearner` has no
// `isCorrect` — the answer key never leaves the server before submission, and
// keeping that a separate type means a component can't accidentally be handed
// one where the other was meant.

export interface QuizOptionForLearner {
  id: string;
  text: string;
  order: number;
}

/** Includes the answer key. Admin authoring, and results after submission. */
export interface QuizOptionWithAnswer extends QuizOptionForLearner {
  isCorrect: boolean;
}

export interface QuizQuestionForLearner {
  id: string;
  prompt: string;
  order: number;
  options: QuizOptionForLearner[];
}

export interface QuizQuestionWithAnswers {
  id: string;
  prompt: string;
  order: number;
  options: QuizOptionWithAnswer[];
}

export interface QuizAnswerSelection {
  questionId: string;
  selectedOptionId: string | null;
}

/** An attempt in progress. */
export interface QuizAttempt {
  id: string;
  quizId: string;
  moduleId: string;
  title: string | null;
  /**
   * Absolute deadline, set by the server when the attempt started. The client
   * counts down to this rather than from a duration, so a drifting or
   * tampered-with clock can't extend the attempt — and the server refuses
   * answers past it regardless.
   */
  expiresAt: string;
  submittedAt: string | null;
  questions: QuizQuestionForLearner[];
  answers: QuizAnswerSelection[];
}

/** A submitted attempt, with the answer key so mistakes can be reviewed. */
export interface QuizAttemptResult {
  id: string;
  quizId: string;
  moduleId: string;
  scorePercent: number;
  passMark: number;
  submittedAt: string | null;
  questions: QuizQuestionWithAnswers[];
  answers: QuizAnswerSelection[];
}

/** A module's quiz as it appears in the lesson plan, before being taken. */
export interface QuizSummary {
  id: string;
  title: string | null;
  questionCount: number;
  timeLimitSeconds: number;
  attemptCount: number;
  /** Best of every attempt — retakes are unlimited and the best one counts. */
  bestScorePercent: number | null;
  /** False until this module's video is done. */
  unlocked: boolean;
}

export interface OutlineModule {
  id: string;
  title: string;
  order: number;
  /** Cloudflare Stream UID. Absent once the access window has closed. */
  videoAssetId?: string;
  videoCompleted: boolean;
  /** False until the previous module's video and quiz are both behind you. */
  unlocked: boolean;
  quiz: QuizSummary | null;
}

/**
 * The whole gated lesson plan for one enrolment. Every lock here is decided
 * server-side; the UI draws them, the endpoints enforce them.
 */
export interface CourseOutline {
  enrollmentId: string;
  courseId: string;
  courseTitle: string;
  enrolledAt: string;
  expiresAt: string;
  hasVideoAccess: boolean;
  completedAt: string | null;
  certificate: {
    id: string;
    verificationCode: string;
    issuedAt: string;
    scorePercent: number | null;
  } | null;
  /** Aggregate needed for a certificate. */
  passMark: number;
  /** Mean of the best score at each quiz, or null if none have been sat. */
  aggregateScorePercent: number | null;
  modules: OutlineModule[];
}

/* ------------------------------------------------------------------ admin */

export interface QuizOptionDraft {
  text: string;
  isCorrect: boolean;
}

export interface QuizQuestionDraft {
  prompt: string;
  options: QuizOptionDraft[];
}

export interface UpsertQuizPayload {
  title?: string;
  timeLimitSeconds: number;
  questions: QuizQuestionDraft[];
}

/** What the admin authoring screen loads back. */
export interface AdminQuiz {
  id: string;
  moduleId: string;
  title: string | null;
  timeLimitSeconds: number;
  questions: QuizQuestionWithAnswers[];
}
