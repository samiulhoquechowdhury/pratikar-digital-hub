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

export const CONTENT_TYPES = ["EBOOK", "CHECKLIST"] as const;
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
};
