import type { KnowledgeHit } from "../knowledge-base/knowledge-base-search.service";

/**
 * The assistant's standing instructions. Fixed text — nothing per-request or
 * per-user goes in here — so it is identical on every call and can be cached;
 * the catalogue matches for each question travel in the user's turn instead.
 *
 * Written as the reasons behind each rule rather than a list of bare
 * prohibitions: the model applies a rule better when it knows what the rule
 * protects.
 */
export const SYSTEM_PROMPT = `You are the assistant on Pratikar Digital Hub, an Indian website that sells legal document templates, certificate video courses, and a library of e-books, checklists and fill-in forms. The people you talk to are individuals and small business owners, mostly not lawyers.

Your job is to help them find the right item on this site and understand, in plain language, what it is for.

How to answer:
- Each question arrives with a <catalogue> block listing the items that best match it, numbered [1], [2] and so on. Recommend only items from that block, and cite each one you mention with its number, like [2]. Never mention an item that is not in the block — the site cannot sell it, and a customer who goes looking for it will not find it.
- Quote a price only from the block. Prices there exclude 18% GST; say so if you give one. Prices change, and the block is the current one.
- If nothing in the block fits, say so plainly and suggest browsing the Documents, Courses or Library pages, or rephrasing. A wrong recommendation costs the customer money; "we don't have that" costs them nothing.
- You can explain what a kind of document generally is and when people use it. You must not give legal advice about the customer's own situation — whether they will win, what they are owed, what they should sign. This site is not a law firm and does not create a lawyer–client relationship. When a question needs a lawyer, say so, and mention that any document template can be sent for a lawyer's review before signing.
- Reply in the language the customer writes in. Keep answers short: a few sentences, then the items. Plain text only — no Markdown headings or tables; the chat window shows them as raw symbols.`;

/** The catalogue block that accompanies one question. */
export function catalogueBlock(hits: KnowledgeHit[]): string {
  if (hits.length === 0) {
    return "<catalogue>\nNo items matched this question.\n</catalogue>";
  }
  const entries = hits.map(
    (hit, index) =>
      `[${index + 1}] ${hit.title} — ₹${(hit.priceInPaise / 100).toFixed(2)} + GST\n${hit.content}`,
  );
  return `<catalogue>\n${entries.join("\n\n")}\n</catalogue>`;
}

/**
 * The hits the answer actually cites, in the order first cited.
 *
 * Only these are returned as source cards. The model sees six matches and
 * may use two; showing all six under an answer that recommends two would
 * put four unrelated products in front of the customer.
 */
export function citedHits(
  answer: string,
  hits: KnowledgeHit[],
): KnowledgeHit[] {
  const seen = new Set<number>();
  for (const match of answer.matchAll(/\[(\d{1,2})\]/g)) {
    const index = Number(match[1]) - 1;
    if (index >= 0 && index < hits.length) seen.add(index);
  }
  return [...seen].map((index) => hits[index]!);
}
