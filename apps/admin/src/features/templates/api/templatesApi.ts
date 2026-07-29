import type {
  Template,
  TemplateFieldSchema,
  TemplateStatus,
} from "@pratikar/types";

import { apiClient } from "@/shared/lib/apiClient";

/** Request body for POST/PUT /documents/templates — mirrors UpsertTemplateDto. */
export interface UpsertTemplatePayload {
  title: string;
  category: string;
  priceInPaise: number;
  reviewPriceInPaise: number;
  fieldSchema: TemplateFieldSchema;
  status: TemplateStatus;
}

export const templatesApi = {
  /** Every status, unlike the customer-facing /documents/templates. */
  listAll: () => apiClient.get<Template[]>("/documents/templates/all"),

  get: (id: string) => apiClient.get<Template>(`/documents/templates/${id}`),

  create: (payload: UpsertTemplatePayload) =>
    apiClient.post<Template>("/documents/templates", payload),

  update: (id: string, payload: UpsertTemplatePayload) =>
    apiClient.put<Template>(`/documents/templates/${id}`, payload),
};
