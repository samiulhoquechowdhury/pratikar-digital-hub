import type { TemplateField } from "@pratikar/types";

/**
 * Checks the answers for a document against its template, before anything is
 * generated.
 *
 * The one place this happens. Until it existed the API wrote whatever
 * `filledData` it was sent straight into the document: the form checked
 * required fields in the browser, and nothing checked anything on the
 * server. With answers now also collected by the AI generator, a wrong or
 * missing field in a legal document is the product's worst failure — and
 * the server is the only place that sees every route in.
 *
 * Each answer is normalised to what the document should print:
 *
 *   text, textarea   trimmed string, length-capped
 *   number           a finite number (a numeric string is accepted)
 *   date             a real calendar date, as YYYY-MM-DD
 *   select           one of the field's own option values, exactly
 *
 * Keys the template doesn't have are dropped rather than rejected: they can't
 * reach the document (it only has tags for its own fields), and refusing the
 * whole request over them helps nobody.
 */

export type AnswerProblem =
  "missing" | "not-a-number" | "not-a-date" | "not-an-option" | "too-long";

export interface FieldProblem {
  key: string;
  label: string;
  problem: AnswerProblem;
}

export type CleanAnswers = Record<string, string | number>;

/** Generous for a name or an address line; stops a pasted essay. */
export const MAX_LENGTH: Record<"text" | "textarea", number> = {
  text: 500,
  textarea: 5000,
};

const isBlank = (value: unknown) =>
  value === undefined ||
  value === null ||
  (typeof value === "string" && value.trim() === "");

/** "2026-02-30" is shaped like a date but isn't one. */
export function isRealDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const [, y, m, d] = match.map(Number);
  const date = new Date(Date.UTC(y!, m! - 1, d));
  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m! - 1 &&
    date.getUTCDate() === d
  );
}

function normalise(
  field: TemplateField,
  value: unknown,
):
  { ok: true; value: string | number } | { ok: false; problem: AnswerProblem } {
  switch (field.type) {
    case "number": {
      const n =
        typeof value === "number"
          ? value
          : typeof value === "string"
            ? Number(value.trim().replace(/,/g, ""))
            : NaN;
      return Number.isFinite(n)
        ? { ok: true, value: n }
        : { ok: false, problem: "not-a-number" };
    }
    case "date": {
      const s = String(value).trim();
      return isRealDate(s)
        ? { ok: true, value: s }
        : { ok: false, problem: "not-a-date" };
    }
    case "select": {
      const s = String(value);
      return (field.options ?? []).some((option) => option.value === s)
        ? { ok: true, value: s }
        : { ok: false, problem: "not-an-option" };
    }
    case "text":
    case "textarea": {
      const s = String(value).trim();
      return s.length > MAX_LENGTH[field.type]
        ? { ok: false, problem: "too-long" }
        : { ok: true, value: s };
    }
  }
}

export function validateAnswers(
  fields: TemplateField[],
  answers: Record<string, unknown>,
): { clean: CleanAnswers; problems: FieldProblem[] } {
  const clean: CleanAnswers = {};
  const problems: FieldProblem[] = [];

  for (const field of fields) {
    const value = answers[field.key];
    if (isBlank(value)) {
      if (field.required) {
        problems.push({
          key: field.key,
          label: field.label,
          problem: "missing",
        });
      }
      continue;
    }
    const result = normalise(field, value);
    if (result.ok) clean[field.key] = result.value;
    else
      problems.push({
        key: field.key,
        label: field.label,
        problem: result.problem,
      });
  }

  return { clean, problems };
}

/**
 * A template's fieldSchema, read defensively: it is a Json column, and a
 * template saved before its editor validated fields could hold anything.
 */
export function fieldsOf(fieldSchema: unknown): TemplateField[] {
  if (!Array.isArray(fieldSchema)) return [];
  return fieldSchema.filter(
    (f): f is TemplateField =>
      !!f &&
      typeof f === "object" &&
      typeof (f as TemplateField).key === "string" &&
      typeof (f as TemplateField).label === "string" &&
      ["text", "textarea", "number", "date", "select"].includes(
        (f as TemplateField).type,
      ),
  );
}
