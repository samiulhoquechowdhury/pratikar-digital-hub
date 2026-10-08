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
    kind: "TEMPLATE" | "CUSTOM";
    /** A custom draft's title; null for a template document. */
    title: string | null;
    template: { title: string } | null;
  };
}

/** What the reviewer works from — GET /documents/reviews/:id/files. */
export interface ReviewFiles {
  title: string;
  kind: "TEMPLATE" | "CUSTOM";
  /** A custom draft's request: what the customer asked for. */
  brief: {
    documentType: string;
    details: string;
    stateCode?: string | null;
  } | null;
  /** A template document's answers. */
  filledData: Record<string, unknown> | null;
  missingDetails: string[];
  /** The advocate-drafted library forms an AI draft was modelled on. */
  references: { id: string; title: string; url: string }[];
  /** Short-lived signed links to the customer's document. */
  docxUrl: string | null;
  pdfUrl: string | null;
}

export interface ReturnInput {
  /** Key returned by uploadFile. */
  reviewedFileUrl?: string;
  /** Send the draft back unchanged as the reviewed document. */
  approveAsDrafted?: boolean;
  notes?: string;
}

/** A review's document title, whichever kind it is. */
export const reviewTitle = (review: QueuedReview) =>
  review.generatedDocument.template?.title ??
  review.generatedDocument.title ??
  "Custom document";

export const reviewsApi = {
  listQueue: () => apiClient.get<QueuedReview[]>("/documents/reviews/queue"),

  claim: (id: string) =>
    apiClient.post<QueuedReview>(`/documents/reviews/${id}/claim`),

  files: (id: string) =>
    apiClient.get<ReviewFiles>(`/documents/reviews/${id}/files`),

  /** Uploads the reviewed Word or PDF file; returns its storage key. */
  uploadFile: (id: string, file: File) =>
    apiClient.upload<{ key: string }>(`/documents/reviews/${id}/file`, file),

  return: (id: string, input: ReturnInput) =>
    apiClient.put<QueuedReview>(`/documents/reviews/${id}/return`, input),
};
