import type {
  GenerateDocumentPayload,
  GeneratedDocument,
  Template,
} from "@pratikar/types";

import { apiClient } from "@/shared/lib/apiClient";

// Thin wrappers around the endpoints in apps/api/src/modules/documents
// (docs/srs.md Section 3.2).
export const documentsApi = {
  listTemplates: () => apiClient.get<Template[]>("/documents/templates"),

  getTemplate: (id: string) =>
    apiClient.get<Template[]>("/documents/templates").then((templates) => {
      const template = templates.find((t) => t.id === id);
      if (!template) throw new Error("TEMPLATE_NOT_FOUND");
      return template;
    }),

  generate: (payload: GenerateDocumentPayload) =>
    apiClient.post<GeneratedDocument>("/documents/generate", payload),

  listMine: () => apiClient.get<GeneratedDocument[]>("/documents/mine"),

  /**
   * Consumes the one-time download and returns a short-lived signed URL
   * (docs/srs.md Section 7, item 1). Calling this moves the document to
   * DOWNLOADED, so it must only be called when the user has actually asked to
   * download — never speculatively to find out whether they could.
   */
  download: (id: string) =>
    apiClient.post<{ fileUrl: string }>(`/documents/${id}/download`),
};
