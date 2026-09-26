import { ContentCategory, ContentType } from "@prisma/client";

/**
 * Turning object keys into a saleable catalogue.
 *
 * Pure, because this is where the judgement calls live — a title a customer
 * reads on a product page is worth getting right, and getting it right is
 * easier to argue about as input/output than through a screen.
 */

/** Words that should never be title-cased in a legal document name. */
const LOWER = new Set([
  "of",
  "for",
  "and",
  "to",
  "in",
  "on",
  "the",
  "a",
  "an",
  "or",
  "with",
]);

/** Initialisms that lose their meaning in title case. */
const UPPER = new Set([
  "noc",
  "gst",
  "nda",
  "llp",
  "pan",
  "tds",
  "msme",
  "rti",
  "fir",
  "poa",
  "mou",
  "itr",
]);

/**
 * A product title from a filename.
 *
 *   "affidavits/ADDRESS PROOF AFFIDAVIT.docx"        -> "Address Proof Affidavit"
 *   "agreements/NDA agreement (DAMANTI).docx"        -> "NDA Agreement"
 *   "froms/form_16_part-b.docx"                      -> "Form 16 Part B"
 *
 * The parenthetical is dropped deliberately: the files carry internal project
 * tags like "(DAMANTI)" that mean nothing to a buyer and would otherwise be
 * printed on the storefront.
 */
export function titleFromKey(key: string): string {
  const base = key.slice(key.lastIndexOf("/") + 1).replace(/\.[^.]+$/, "");

  const words = base
    .replace(/\([^)]*\)/g, " ")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);

  return words
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (UPPER.has(lower)) return lower.toUpperCase();
      // Keep digits and mixed tokens as typed — "16", "2A", "B".
      if (/\d/.test(word)) return word.toUpperCase();
      if (index > 0 && LOWER.has(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

/** The folder an object sits in, or "" for one at the root. */
export const folderOf = (key: string): string =>
  key.includes("/") ? key.slice(0, key.indexOf("/")) : "";

/**
 * A suggested category and type per folder, so 181 agreements don't have to
 * be classified one at a time. A suggestion only — the screen lets an
 * operator override it before anything is published, because "froms" is a
 * typo'd folder of court forms and no rule will ever infer that.
 */
const FOLDER_RULES: Record<
  string,
  { category: ContentCategory; type: ContentType }
> = {
  agreements: {
    category: ContentCategory.LEGAL_PRACTICE,
    type: ContentType.FORM,
  },
  affidavits: {
    category: ContentCategory.LEGAL_PRACTICE,
    type: ContentType.FORM,
  },
  "legal-notices": {
    category: ContentCategory.LEGAL_PRACTICE,
    type: ContentType.FORM,
  },
  bails: { category: ContentCategory.LEGAL_PRACTICE, type: ContentType.FORM },
  froms: { category: ContentCategory.LEGAL_PRACTICE, type: ContentType.FORM },
  forms: { category: ContentCategory.LEGAL_PRACTICE, type: ContentType.FORM },
  checklist: {
    category: ContentCategory.CHECKLISTS_REFERENCE,
    type: ContentType.CHECKLIST,
  },
  checklists: {
    category: ContentCategory.CHECKLISTS_REFERENCE,
    type: ContentType.CHECKLIST,
  },
  "e-books": {
    category: ContentCategory.BUSINESS_COMPLIANCE,
    type: ContentType.EBOOK,
  },
  ebooks: {
    category: ContentCategory.BUSINESS_COMPLIANCE,
    type: ContentType.EBOOK,
  },
};

export function suggestionFor(key: string): {
  category: ContentCategory;
  type: ContentType;
} {
  return (
    FOLDER_RULES[folderOf(key).toLowerCase()] ?? {
      // Anything unrecognised lands somewhere harmless and obviously
      // unclassified, rather than being guessed into a category it would
      // then be sold under.
      category: ContentCategory.LEGAL_PRACTICE,
      type: ContentType.FORM,
    }
  );
}

/** Extensions a customer can actually open. */
const SELLABLE = new Set([".docx", ".doc", ".pdf", ".xlsx", ".pptx"]);

export const isSellable = (key: string): boolean =>
  SELLABLE.has(key.slice(key.lastIndexOf(".")).toLowerCase());

/**
 * Prefixes the app writes to itself: generated documents, tagged templates,
 * invoices and credit notes. They share the bucket with the uploaded forms,
 * but they are output, not stock — a generated document carries a customer's
 * name and address, and an invoice is a customer's tax record.
 */
const APP_WRITTEN = ["documents/", "templates/", "invoices/", "credit-notes/"];

export const isAppWritten = (key: string): boolean =>
  APP_WRITTEN.some((prefix) => key.startsWith(prefix));
