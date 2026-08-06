import type {
  CertificateVerification,
  Course,
  CourseOutline,
  Enrollment,
  QuizAttempt,
  QuizAttemptResult,
} from "@pratikar/types";

import { apiClient } from "@/shared/lib/apiClient";

// Wrappers around apps/api/src/modules/lms (docs/srs.md Section 3.4).
export const lmsApi = {
  list: () => apiClient.get<Course[]>("/courses"),

  // "catalogue/" is the customer route: published courses only, and module
  // rows without the Cloudflare Stream ids that would give the videos away.
  get: (id: string) => apiClient.get<Course>(`/courses/catalogue/${id}`),

  listMyEnrollments: () => apiClient.get<Enrollment[]>("/courses/mine"),

  /** The gated lesson plan: what's unlocked, watched, and scored. */
  getOutline: (enrollmentId: string) =>
    apiClient.get<CourseOutline>(
      `/courses/enrollments/${enrollmentId}/outline`,
    ),

  completeModule: (enrollmentId: string, moduleId: string) =>
    apiClient.post<unknown>(
      `/courses/enrollments/${enrollmentId}/modules/${moduleId}/complete`,
    ),

  /**
   * Starts the test, or resumes one already running. The server decides
   * which — refreshing the page mid-quiz must not hand out a fresh timer.
   */
  startAttempt: (quizId: string, enrollmentId: string) =>
    apiClient.post<QuizAttempt>(`/courses/quizzes/${quizId}/attempts`, {
      enrollmentId,
    }),

  /** Saved per question as the learner goes, so a timeout costs only blanks. */
  saveAnswer: (
    attemptId: string,
    questionId: string,
    selectedOptionId: string | null,
  ) =>
    apiClient.put<{ saved: boolean }>(
      `/courses/attempts/${attemptId}/answers`,
      { questionId, selectedOptionId },
    ),

  submitAttempt: (attemptId: string) =>
    apiClient.post<QuizAttemptResult>(`/courses/attempts/${attemptId}/submit`),

  /** Public — no session needed, so an employer can check a candidate's claim. */
  verifyCertificate: (code: string) =>
    apiClient.get<CertificateVerification>(
      `/courses/certificates/verify/${encodeURIComponent(code)}`,
    ),
};
