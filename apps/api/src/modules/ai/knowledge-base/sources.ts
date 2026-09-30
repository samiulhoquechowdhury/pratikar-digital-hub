import { createHash } from "node:crypto";

import type { ContentCategory, ContentType } from "@prisma/client";

/**
 * What goes into the knowledge base, as text.
 *
 * Pure, so what the chatbot will "know" about a product can be read and argued
 * about as input and output — the same reason the catalogue's title rules
 * live in content-library/catalogue.ts.
 *
 * Deliberately left out: price and status. A retrieved row is looked up again
 * before anything is said about it, so the chatbot quotes today's price rather
 * than whatever was embedded, and a price edit costs no re-embedding. Status
 * decides whether a row is indexed at all (see the processor), not what it
 * says.
 */

/** docs/trd.md's faq and policy join this once there is content for them. */
export type KnowledgeSourceType = "template" | "course" | "content";

export interface KnowledgeSourceRef {
  sourceType: KnowledgeSourceType;
  sourceId: string;
}

/** The embedding column's width. Changing it is a migration, not a setting. */
export const KNOWLEDGE_BASE_DIMENSIONS = 1024;

/** `LEGAL_PRACTICE` -> `"Legal practice"`. */
const humanize = (value: string): string => {
  const lower = value.toLowerCase().replace(/_/g, " ");
  return lower.charAt(0).toUpperCase() + lower.slice(1);
};

/**
 * Labels from a template's fieldSchema, read defensively: it is a Json column,
 * and a malformed entry should cost that one label, not the whole template's
 * place in the index.
 */
function fieldLabels(fieldSchema: unknown): string[] {
  if (!Array.isArray(fieldSchema)) return [];
  return fieldSchema
    .map((field: unknown) =>
      field && typeof field === "object" && "label" in field
        ? String(field.label).trim()
        : "",
    )
    .filter((label) => label.length > 0);
}

export function describeTemplate(template: {
  title: string;
  category: string;
  fieldSchema: unknown;
}): string {
  const labels = fieldLabels(template.fieldSchema);
  return [
    template.title,
    "A document template: the customer answers a short form and the finished document is generated for them, with an optional review by a lawyer.",
    `Category: ${humanize(template.category)}.`,
    // What the form asks for is the best evidence of what the document is —
    // "Landlord's name, Monthly rent, Security deposit" says rent agreement
    // more plainly than most titles do.
    labels.length > 0 ? `The form asks for: ${labels.join(", ")}.` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function describeCourse(course: {
  title: string;
  description: string | null;
  accessDurationDays: number;
  modules: { title: string; order: number }[];
}): string {
  const lessons = [...course.modules].sort((a, b) => a.order - b.order);
  return [
    course.title,
    `An online video course${
      lessons.length > 0
        ? ` of ${lessons.length} lesson${lessons.length === 1 ? "" : "s"}`
        : ""
    }, available for ${course.accessDurationDays} days after enrolment.`,
    course.description?.trim() ?? "",
    lessons.length > 0
      ? `Lessons: ${lessons.map((m, i) => `${i + 1}. ${m.title}`).join("; ")}.`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

const CONTENT_TYPE: Record<ContentType, string> = {
  EBOOK: "An e-book, downloaded after purchase.",
  CHECKLIST: "A checklist, downloaded after purchase.",
  // The distinction the schema draws between a FORM and a template matters
  // to a customer too: one is filled in for you, this one is not.
  FORM: "A fill-in-the-blank form, downloaded after purchase and completed by the customer themselves.",
};

export function describeContentItem(item: {
  title: string;
  category: ContentCategory;
  type: ContentType;
}): string {
  return [
    item.title,
    CONTENT_TYPE[item.type],
    `Content library section: ${humanize(item.category)}.`,
  ].join("\n");
}

/**
 * Identifies an embedding. The model is part of it: switching models has to
 * re-embed everything, and a reindex after the switch should see every row as
 * changed without anyone having to remember to clear the table.
 */
export const contentHash = (model: string, content: string): string =>
  createHash("sha256").update(`${model}\n${content}`).digest("hex");
