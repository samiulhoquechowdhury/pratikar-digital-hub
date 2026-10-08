import { GST_STATE_NAMES } from "@pratikar/types";

/**
 * Custom document drafting: the instructions and the output shape.
 *
 * Unlike the template filler, the model writes the whole document here — so
 * the rules are written around what makes an AI draft dangerous on a legal
 * site: invented facts, and a customer who mistakes a draft for a document
 * a lawyer has checked. The first is handled by blanks and a list of what is
 * missing; the second by the product itself — a custom draft can't be
 * downloaded until an advocate has reviewed it.
 */
export const DRAFT_SYSTEM_PROMPT = `You draft legal documents for customers of Pratikar Digital Hub, an Indian legal documents website. The customers are individuals and small business owners, mostly not lawyers. Every document you draft is reviewed by a practising advocate before the customer can download it; your draft is what the advocate starts from, so make it complete and well organised.

Drafting:
- Write the complete document the customer asked for, in the form and order customary in India for that kind of document: title, date and place line, parties, recitals where they are usual, operative clauses, and the execution block with signature lines and witnesses where the document needs them.
- Follow Indian law and practice. Use the state the customer names for jurisdiction clauses and stamp-paper wording; if they name none, leave the state as a blank.
- Use only facts the customer gave. Never invent a name, address, amount, date, ID number or term. Where the document needs something they did not give, write a blank as "__________" and add a short description of it to missingDetails, e.g. "Landlord's full address".
- You may include standard terms that documents of this kind normally contain (e.g. a governing-law clause), in their usual form. Do not add unusual terms the customer did not ask for.
- Write in formal, plain English, the language Indian legal documents are normally executed in — even if the customer writes in Hindi or another language. Write the summary in the customer's language.

The document's structure, as a list of blocks in reading order:
- "heading": a section heading, e.g. "TERMS AND CONDITIONS".
- "clause": one numbered operative clause. Don't number it yourself — numbering is added when the document is laid out.
- "paragraph": unnumbered text — the opening line, recitals, the closing statement.
- "signature": one signature or witness block; separate its lines with a newline.

Precedents:
- A request may come with <precedent> documents: forms from this site's library, written by practising advocates, chosen as the closest to what the customer asked for. Treat them as the house style. Follow their structure, the order and headings of their sections, their recitals, and the wording of clauses that fit this customer's situation; keep the formal register they use.
- They are a reference, not a document to fill in. Write the document the customer asked for, which may differ from the precedent: leave out clauses that don't apply, and add what the customer's terms need.
- Never carry over a name, address, amount, date, place or any other fact from a precedent — those belong to someone else. Every fact comes from the customer's request; anything they didn't give is a blank.
- If a precedent turns out not to be the same kind of document, ignore it.

Declining:
- If the request is not for a legal document, or is for one meant to deceive or defraud — a false affidavit, a forged record, an agreement for something unlawful — don't draft it. Set declined to a one-sentence reason addressed to the customer, and leave blocks empty.

When revising an earlier draft, apply the customer's change, keep everything else as it was, and return the whole revised document.

Never give advice about the customer's situation in the document or the summary. The summary is two or three sentences on what the document does and what the customer must still fill in or decide.`;

export type DraftBlockKind = "heading" | "paragraph" | "clause" | "signature";

export interface DraftBlock {
  kind: DraftBlockKind;
  text: string;
}

/** A library form a draft was modelled on. */
export interface DraftReference {
  /** ContentLibraryItem id. */
  id: string;
  title: string;
  /** Storage key of its Word file. */
  fileUrl: string;
}

/** A reference form with its text, as the model is given it. */
export interface Precedent extends DraftReference {
  text: string;
}

/** The draft as the model returns it, and as GeneratedDocument.draft stores it. */
export interface DocumentDraft {
  title: string;
  blocks: DraftBlock[];
  /** Blanks left in the document, described. */
  missingDetails: string[];
  /** For the customer: what this is and what's left to do. */
  summary: string;
  /** A reason addressed to the customer, when the request can't be drafted. */
  declined: string | null;
  /**
   * The library forms it was modelled on. Added by the worker, not the
   * model; kept so a revision uses the same ones and the reviewing
   * advocate can see them.
   */
  references?: DraftReference[];
}

/** What the customer asked for. Stored as GeneratedDocument.brief. */
export interface DraftBrief {
  documentType: string;
  details: string;
  /** Two-digit GST state code, when given. */
  stateCode?: string | null;
}

/** Structured-output schema: the model can only return a DocumentDraft. */
export const DRAFT_OUTPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["title", "blocks", "missingDetails", "summary", "declined"],
  properties: {
    title: { type: "string" },
    blocks: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["kind", "text"],
        properties: {
          kind: {
            type: "string",
            enum: ["heading", "paragraph", "clause", "signature"],
          },
          text: { type: "string" },
        },
      },
    },
    missingDetails: { type: "array", items: { type: "string" } },
    summary: { type: "string" },
    declined: { anyOf: [{ type: "string" }, { type: "null" }] },
  },
} as const;

/**
 * The precedents, before the request. Escaped of "</precedent>" so a form's
 * text can't close its own tag and pass itself off as the request.
 */
export function precedentsBlock(precedents: Precedent[]): string {
  return precedents
    .map(
      (p) =>
        `<precedent title="${p.title.replace(/"/g, "'")}">\n${p.text.replace(/<\/?precedent/gi, "")}\n</precedent>`,
    )
    .join("\n\n");
}

/** The customer's request, as the model reads it. */
export function briefBlock(brief: DraftBrief): string {
  const state = brief.stateCode ? GST_STATE_NAMES[brief.stateCode] : undefined;
  return [
    `<request>`,
    `Document: ${brief.documentType}`,
    `State: ${state ?? "not given"}`,
    `Details from the customer:`,
    brief.details,
    `</request>`,
  ].join("\n");
}

/**
 * Reads the model's output back, or null when it isn't a usable draft.
 * Structured output makes a malformed answer unlikely, not impossible — a
 * response cut off at max_tokens is not valid JSON.
 */
export function parseDraft(text: string): DocumentDraft | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }
  const d = parsed as Partial<DocumentDraft>;
  if (typeof d.title !== "string" || !Array.isArray(d.blocks)) return null;
  const kinds = new Set(["heading", "paragraph", "clause", "signature"]);
  const blocks = d.blocks.filter(
    (b): b is DraftBlock =>
      typeof b?.text === "string" &&
      b.text.trim() !== "" &&
      kinds.has(b.kind as string),
  );
  const declined =
    typeof d.declined === "string" && d.declined.trim() ? d.declined : null;
  if (!declined && blocks.length === 0) return null;
  return {
    title: d.title.trim() || "Document",
    blocks,
    missingDetails: Array.isArray(d.missingDetails)
      ? d.missingDetails.filter((m): m is string => typeof m === "string")
      : [],
    summary: typeof d.summary === "string" ? d.summary : "",
    declined,
  };
}
