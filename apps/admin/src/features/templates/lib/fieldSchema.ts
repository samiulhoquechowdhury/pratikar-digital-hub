import type {
  TemplateField,
  TemplateFieldSchema,
  TemplateFieldType,
} from "@pratikar/types";

export const FIELD_TYPES: readonly TemplateFieldType[] = [
  "text",
  "textarea",
  "date",
  "number",
  "select",
];

/**
 * A field `key` becomes a docxtemplater tag in the .docx and a key in
 * GeneratedDocument.filledData. docxtemplater resolves `{tagName}` by plain
 * property lookup, so anything outside identifier characters either fails to
 * match the tag or renders blank — and a blank clause in a rent agreement is
 * a silent, legally meaningful defect rather than a visible error.
 */
const KEY_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

export const createEmptyField = (): TemplateField => ({
  key: "",
  label: "",
  type: "text",
  required: true,
});

export const addField = (schema: TemplateFieldSchema): TemplateFieldSchema => [
  ...schema,
  createEmptyField(),
];

export const removeField = (
  schema: TemplateFieldSchema,
  index: number,
): TemplateFieldSchema => schema.filter((_, i) => i !== index);

export const updateField = (
  schema: TemplateFieldSchema,
  index: number,
  patch: Partial<TemplateField>,
): TemplateFieldSchema =>
  schema.map((field, i) => {
    if (i !== index) return field;
    const next = { ...field, ...patch };
    // Options only mean anything for a select. Drop them on type change so a
    // stale list can't travel to the API and fail DTO validation there.
    if (next.type !== "select") delete next.options;
    else if (!next.options) next.options = [];
    return next;
  });

/** Reorder matters: field order is the order the customer fills them in. */
export const moveField = (
  schema: TemplateFieldSchema,
  from: number,
  to: number,
): TemplateFieldSchema => {
  if (to < 0 || to >= schema.length || from === to) return schema;
  const next = [...schema];
  const [moved] = next.splice(from, 1);
  if (!moved) return schema;
  next.splice(to, 0, moved);
  return next;
};

export interface FieldSchemaProblem {
  /** Index into the schema, or null for schema-wide problems. */
  index: number | null;
  message: string;
}

/**
 * Validates before the request goes out. The API re-validates through
 * UpsertTemplateDto — this exists to give a usable message next to the offending
 * row instead of a 400 blob, and to catch duplicate keys, which the DTO's
 * per-item validation cannot see.
 */
export function validateFieldSchema(
  schema: TemplateFieldSchema,
): FieldSchemaProblem[] {
  const problems: FieldSchemaProblem[] = [];

  if (schema.length === 0) {
    problems.push({
      index: null,
      message:
        "Add at least one field — a template with no fields generates an empty document.",
    });
  }

  const seen = new Map<string, number>();

  schema.forEach((field, index) => {
    if (!field.key.trim()) {
      problems.push({ index, message: "Field key is required." });
    } else if (!KEY_PATTERN.test(field.key)) {
      problems.push({
        index,
        message: `"${field.key}" isn't a valid key. Use letters, numbers and underscores, starting with a letter or underscore — it has to match the {tag} in the .docx.`,
      });
    } else {
      const firstSeenAt = seen.get(field.key);
      if (firstSeenAt !== undefined) {
        problems.push({
          index,
          // Duplicates don't error anywhere downstream — the later value just
          // overwrites the earlier one in filledData, so one of the two inputs
          // the customer filled silently vanishes from the document.
          message: `Duplicate key "${field.key}" (already used by field ${firstSeenAt + 1}). Keys must be unique.`,
        });
      } else {
        seen.set(field.key, index);
      }
    }

    if (!field.label.trim()) {
      problems.push({ index, message: "Field label is required." });
    }

    if (field.type === "select") {
      const options = field.options ?? [];
      if (options.length === 0) {
        problems.push({
          index,
          message: "A dropdown needs at least one option.",
        });
      }
      if (options.some((o) => !o.value.trim() || !o.label.trim())) {
        problems.push({
          index,
          message: "Every dropdown option needs both a value and a label.",
        });
      }
    }
  });

  return problems;
}

/**
 * Admins think in rupees; the API and DB store paise (integer, no float
 * rounding on money). Returns null for anything that isn't a usable amount so
 * the caller can show a field error rather than posting NaN.
 */
export function rupeesToPaise(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const rupees = Number(trimmed);
  if (!Number.isFinite(rupees) || rupees < 0) return null;
  return Math.round(rupees * 100);
}

export const paiseToRupees = (paise: number): string =>
  (paise / 100).toFixed(2);
