import type { Blank } from "./blanks";

/**
 * A first guess at what a blank wants, from its width and the words around
 * it. Only a guess — every one is shown to an operator before it is saved.
 *
 * Worth guessing at all because the alternative is setting the type on a
 * hundred fields by hand, and the cost of a wrong guess is one dropdown
 * change rather than a broken document.
 */
export type GuessedType = "text" | "textarea" | "date" | "number";

const DATE_WORDS = /\b(date|dated|day of|on this|made on|year of)\s*$/i;
const MONEY_WORDS =
  /\b(rs\.?|rupees|amount|sum of|price|rent|salary|fee|deposit|₹)\s*$/i;
const COUNT_WORDS =
  /\b(no\.?|number|aged about|age|years|months|days|pin ?code)\s*$/i;

export function guessFieldType(blank: Blank): GuessedType {
  const before = blank.before;

  if (DATE_WORDS.test(before)) return "date";
  if (MONEY_WORDS.test(before) || COUNT_WORDS.test(before)) return "number";

  // A very long rule is a free-text area — the document is giving the reader
  // several lines, not asking for a name. 60 underscores is roughly a full
  // line at body size in these documents.
  if (blank.width >= 60) return "textarea";

  return "text";
}

/** "daughterWifeOf" -> "Daughter wife of", as a starting label. */
export function labelFor(field: string): string {
  const spaced = field
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}
