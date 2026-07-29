import { apiClient } from "@/shared/lib/apiClient";

export type DocumentReviewStatus =
  "QUEUED" | "IN_REVIEW" | "RETURNED" | "CANCELLED";

/** Shape returned by GET /documents/reviews/queue, which includes the document. */
export interface QueuedReview {
  id: string;
  generatedDocumentId: string;
  requestedByUserId: string;
  assignedToUserId: string | null;
  status: DocumentReviewStatus;
  reviewedFileUrl: string | null;
  notes: string | null;
  createdAt: string;
  generatedDocument: {
    id: string;
    fileUrl: string;
    template: { title: string };
  };
}

export const reviewsApi = {
  listQueue: () => apiClient.get<QueuedReview[]>("/documents/reviews/queue"),

  claim: (id: string) =>
    apiClient.post<QueuedReview>(`/documents/reviews/${id}/claim`),

  return: (id: string, reviewedFileUrl: string, notes?: string) =>
    apiClient.put<QueuedReview>(`/documents/reviews/${id}/return`, {
      reviewedFileUrl,
      notes,
    }),
};
