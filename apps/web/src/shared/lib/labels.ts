import type { ContentCategory, ContentType } from "@pratikar/types";

import type { CatalogueKind } from "../components/CatalogueCard";

/** SCREAMING_CASE enum values are not customer-facing copy. */
export const CONTENT_CATEGORY_LABELS: Record<ContentCategory, string> = {
  LEGAL_PRACTICE: "Legal practice",
  BUSINESS_COMPLIANCE: "Business & compliance",
  PROPERTY_DOCUMENTATION: "Property documentation",
  DIGITAL_CAREER: "Digital career",
  CHECKLISTS_REFERENCE: "Checklists & reference",
};

export const CONTENT_KIND: Record<ContentType, CatalogueKind> = {
  EBOOK: "ebook",
  CHECKLIST: "checklist",
  FORM: "form",
};

/**
 * Template categories are free text (the taxonomy is still open — docs/srs.md
 * Section 8, item 2), typed by staff in whatever case they chose. Title-case
 * for display so "property" and "Property" don't read as two categories.
 */
export const templateCategoryLabel = (category: string) =>
  category.trim().replace(/^\p{L}/u, (first) => first.toUpperCase());
