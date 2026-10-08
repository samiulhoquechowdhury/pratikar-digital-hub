import type {
  DocumentKind,
  DocumentReviewStatus,
  DraftCustomPayload,
  GenerateDocumentPayload,
  GeneratedDocument,
  GeneratedDocumentStatus,
  Template,
} from "@pratikar/types";

import { apiClient } from "@/shared/lib/apiClient";

// Thin wrappers around the endpoints in apps/api/src/modules/documents
// (docs/srs.md Section 3.2).

/** The latest advocate review of a document, as its owner sees it. */
export interface MyDocumentReview {
  id: string;
  status: DocumentReviewStatus;
  /** The advocate's comments — only once the review is back. */
  notes: string | null;
  createdAt: string;
  returnedAt: string | null;
  hasPdf: boolean;
}

/**
 * One of the customer's documents, as DocumentsService.toCustomerView
 * returns it: a single title and review price whichever kind it is, and no
 * storage keys.
 */
export interface MyDocument {
  id: string;
  kind: DocumentKind;
  templateId: string | null;
  title: string;
  status: GeneratedDocumentStatus;
  createdAt: string;
  downloadedAt: string | null;
  /** A template document's answers; empty for a custom draft. */
  filledData: Record<string, unknown>;
  /** False while the document is being generated or drafted. */
  ready: boolean;
  /** A template document's own price; null for a custom draft. */
  priceInPaise: number | null;
  /** What an advocate review costs, before GST. */
  reviewPriceInPaise: number;
  template: Pick<
    Template,
    "title" | "priceInPaise" | "reviewPriceInPaise"
  > | null;
  // Custom drafts only.
  brief: DraftCustomPayload | null;
  summary: string | null;
  missingDetails: string[];
  /** Titles of the advocate-drafted library forms the draft was modelled on. */
  basedOn: string[];
  revisionCount: number;
  /** Why drafting or the last revision failed, in the customer's words. */
  draftError: string | null;
  review: MyDocumentReview | null;
}

export interface DraftPricing {
  /** False when the server has no model configured. */
  available: boolean;
  reviewPriceInPaise: number;
  maxRevisions: number;
}

export const documentsApi = {
  listTemplates: () => apiClient.get<Template[]>("/documents/templates"),

  // Its own public endpoint — this used to download the whole catalogue and
  // search it, which grew with every template added.
  getTemplate: (id: string) =>
    apiClient.get<Template>(`/documents/templates/catalogue/${id}`),

  generate: (payload: GenerateDocumentPayload) =>
    apiClient.post<GeneratedDocument>("/documents/generate", payload),

  listMine: () => apiClient.get<MyDocument[]>("/documents/mine"),

  getMine: (id: string) => apiClient.get<MyDocument>(`/documents/mine/${id}`),

  /**
   * Consumes the one-time download and returns a short-lived signed URL
   * (docs/srs.md Section 7, item 1). Calling this moves the document to
   * DOWNLOADED, so it must only be called when the user has actually asked to
   * download — never speculatively to find out whether they could.
   */
  download: (id: string) =>
    apiClient.post<{ fileUrl: string; pdfUrl: string | null }>(
      `/documents/${id}/download`,
    ),

  /** The advocate-reviewed copy. Can be fetched again, unlike download(). */
  reviewedDownload: (id: string) =>
    apiClient.post<{ fileUrl: string; pdfUrl: string | null }>(
      `/documents/${id}/reviewed-download`,
    ),

  /**
   * The free, watermarked preview: links to each page as an image. `ready`
   * is false while the document is still being generated; `error` says why
   * a custom draft failed.
   */
  preview: (id: string) =>
    apiClient.get<{ ready: boolean; pages: string[]; error?: string | null }>(
      `/documents/${id}/preview`,
    ),

  draftPricing: () => apiClient.get<DraftPricing>("/documents/custom/pricing"),

  /** Asks the AI to draft a custom document. Returns its id at once; drafting runs in the background. */
  draftCustom: (payload: DraftCustomPayload) =>
    apiClient.post<{ id: string }>("/documents/custom", payload),

  revise: (id: string, instruction: string) =>
    apiClient.post<{ id: string }>(`/documents/${id}/revise`, { instruction }),
};
