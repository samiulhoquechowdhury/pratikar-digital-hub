import type { TemplateStatus } from "@pratikar/types";

import { apiClient } from "@/shared/lib/apiClient";

export const CONTENT_CATEGORIES = [
  "LEGAL_PRACTICE",
  "BUSINESS_COMPLIANCE",
  "PROPERTY_DOCUMENTATION",
  "DIGITAL_CAREER",
  "CHECKLISTS_REFERENCE",
] as const;
export type ContentCategory = (typeof CONTENT_CATEGORIES)[number];

// FORM covers the fill-in-the-blank documents — affidavits, agreements,
// notices. They are sold as-is; a Template is the thing the generator fills.
export const CONTENT_TYPES = ["EBOOK", "CHECKLIST", "FORM"] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];

export interface ContentItem {
  id: string;
  title: string;
  category: ContentCategory;
  type: ContentType;
  priceInPaise: number;
  fileUrl: string;
  status: TemplateStatus;
  createdAt: string;
}

export interface UpsertContentItemPayload {
  title: string;
  category: ContentCategory;
  type: ContentType;
  priceInPaise: number;
  fileUrl: string;
  status: TemplateStatus;
}

export const contentLibraryApi = {
  /** Every status, unlike the customer-facing GET /content-library. */
  listAll: () => apiClient.get<ContentItem[]>("/content-library/all"),

  get: (id: string) => apiClient.get<ContentItem>(`/content-library/${id}`),

  create: (payload: UpsertContentItemPayload) =>
    apiClient.post<ContentItem>("/content-library", payload),

  update: (id: string, payload: UpsertContentItemPayload) =>
    apiClient.put<ContentItem>(`/content-library/${id}`, payload),

  /** What is in object storage, with a flag for what is already catalogued. */
  listStorage: () => apiClient.get<StorageListing>("/content-library/storage"),

  /** Publishes already-stored files as catalogue items. Nothing is uploaded. */
  importFromStorage: (payload: ImportPayload) =>
    apiClient.post<{ created: number; skipped: number }>(
      "/content-library/import",
      payload,
    ),
};

/** One file in the bucket, with the catalogue fields we can infer for it. */
export interface StorageObject {
  key: string;
  sizeInBytes: number;
  lastModified: string | null;
  folder: string;
  suggestedTitle: string;
  category: ContentCategory;
  type: ContentType;
  catalogued: boolean;
}

export interface StorageListing {
  totalObjects: number;
  skippedUnsupported: number;
  objects: StorageObject[];
}

export interface ImportPayload {
  items: {
    title: string;
    category: ContentCategory;
    type: ContentType;
    priceInPaise: number;
    fileUrl: string;
  }[];
  publish?: boolean;
}
