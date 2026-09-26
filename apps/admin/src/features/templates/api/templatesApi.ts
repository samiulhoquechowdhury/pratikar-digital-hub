import type {
  Template,
  TemplateFieldSchema,
  TemplateFieldType,
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

/** A .docx in the bucket that a template could be built from. */
export interface TaggableObject {
  key: string;
  sizeInBytes: number;
  lastModified: string | null;
  folder: string;
  suggestedTitle: string;
  /** The template already built from this form, if one has been. */
  template: { id: string; title: string; status: TemplateStatus } | null;
}

export interface TaggableListing {
  totalObjects: number;
  /** Everything that isn't a .docx — a PDF has no blanks to read. */
  skippedUnsupported: number;
  objects: TaggableObject[];
}

/** One underscore run in the document, with the words around it. */
export interface StoredBlank {
  index: number;
  width: number;
  before: string;
  after: string;
  suggestedField: string;
  suggestedLabel: string;
  suggestedType: TemplateFieldType;
}

export interface BlanksResponse {
  storageKey: string;
  blanks: StoredBlank[];
}

export interface CreateFromStoragePayload {
  storageKey: string;
  title: string;
  category: string;
  priceInPaise: number;
  reviewPriceInPaise: number;
  fields: {
    index: number;
    key: string;
    label: string;
    type: TemplateFieldType;
    required: boolean;
  }[];
}

export const templatesApi = {
  /** Every status, unlike the customer-facing /documents/templates. */
  listAll: () => apiClient.get<Template[]>("/documents/templates/all"),

  get: (id: string) => apiClient.get<Template>(`/documents/templates/${id}`),

  create: (payload: UpsertTemplatePayload) =>
    apiClient.post<Template>("/documents/templates", payload),

  update: (id: string, payload: UpsertTemplatePayload) =>
    apiClient.put<Template>(`/documents/templates/${id}`, payload),

  /** The .docx forms in storage, and which already have a template. */
  listTaggable: () =>
    apiClient.get<TaggableListing>("/documents/templates/storage"),

  /** Reads one form's blanks, with a suggested name and type for each. */
  readBlanks: (key: string) =>
    apiClient.get<BlanksResponse>(
      `/documents/templates/blanks?key=${encodeURIComponent(key)}`,
    ),

  /** Writes a tagged copy beside the original and registers it as a DRAFT. */
  createFromStorage: (payload: CreateFromStoragePayload) =>
    apiClient.post<Template>("/documents/templates/from-storage", payload),
};
