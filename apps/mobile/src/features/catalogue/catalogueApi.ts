import type {
  ContentCategory,
  ContentLibraryItem,
  ContentType,
  Course,
  Template,
} from "@pratikar/types";
import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";

// The public catalogue, as the website reads it. "catalogue/" routes are the
// customer-facing ones — the plain ids are admin routes that carry storage
// keys.
export const catalogueApi = {
  templates: () => api.get<Template[]>("/documents/templates"),
  template: (id: string) =>
    api.get<Template>(`/documents/templates/catalogue/${id}`),
  library: () => api.get<ContentLibraryItem[]>("/content-library"),
  libraryItem: (id: string) =>
    api.get<ContentLibraryItem>(`/content-library/catalogue/${id}`),
  courses: () => api.get<Course[]>("/courses"),
  course: (id: string) => api.get<Course>(`/courses/catalogue/${id}`),
};

export const useTemplates = () =>
  useQuery({ queryKey: ["templates"], queryFn: catalogueApi.templates });

export const useLibrary = () =>
  useQuery({ queryKey: ["library"], queryFn: catalogueApi.library });

export const useCourses = () =>
  useQuery({ queryKey: ["courses"], queryFn: catalogueApi.courses });

/** SCREAMING_CASE enum values are not customer-facing copy. */
export const CONTENT_CATEGORY_LABELS: Record<ContentCategory, string> = {
  LEGAL_PRACTICE: "Legal practice",
  BUSINESS_COMPLIANCE: "Business & compliance",
  PROPERTY_DOCUMENTATION: "Property documentation",
  DIGITAL_CAREER: "Digital career",
  CHECKLISTS_REFERENCE: "Checklists & reference",
};

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  FORM: "Legal form",
  CHECKLIST: "Checklist",
  EBOOK: "E-book",
};

/** Template categories are free text; title-case them for display. */
export const templateCategoryLabel = (category: string) =>
  category.trim().replace(/^\p{L}/u, (first) => first.toUpperCase());

/** The free excerpt: the first pages as watermarked images. */
export const libraryPreview = (id: string) =>
  api.get<{ ready: boolean; pages: string[] }>(
    `/content-library/catalogue/${id}/preview`,
  );

/** A short-lived signed URL; fails with NOT_PURCHASED without a paid order. */
export const libraryDownload = (id: string) =>
  api.post<{ fileUrl: string; title: string }>(
    `/content-library/${id}/download`,
  );
