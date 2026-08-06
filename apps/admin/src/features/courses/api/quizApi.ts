import type { AdminQuiz, UpsertQuizPayload } from "@pratikar/types";

import { apiClient } from "@/shared/lib/apiClient";

/**
 * Quiz authoring. These endpoints sit on their own `/modules` controller,
 * role-guarded at the class, because every response carries the answer key —
 * the one thing that must never reach a learner.
 */
export const quizApi = {
  /** Null when the module has no quiz yet. */
  get: (moduleId: string) =>
    apiClient.get<AdminQuiz | null>(`/modules/${moduleId}/quiz`),

  save: (moduleId: string, payload: UpsertQuizPayload) =>
    apiClient.put<AdminQuiz>(`/modules/${moduleId}/quiz`, payload),

  remove: (moduleId: string) =>
    apiClient.del<void>(`/modules/${moduleId}/quiz`),
};
