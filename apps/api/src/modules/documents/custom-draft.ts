/** Default advocate-review fee for a custom draft: ₹499 before GST. */
const DEFAULT_REVIEW_PRICE_PAISE = 49_900;

/**
 * What an advocate review of a custom AI draft costs, in paise before GST.
 *
 * A custom draft has no template, so no template price: the review is what
 * the customer buys, and the reviewed document is what they download. Set by
 * CUSTOM_DRAFT_REVIEW_PRICE_PAISE; anything that isn't a positive whole
 * number falls back to the default rather than selling the review for ₹0.
 */
export function customDraftReviewPrice(
  raw = process.env.CUSTOM_DRAFT_REVIEW_PRICE_PAISE,
): number {
  const value = Number(raw);
  return Number.isInteger(value) && value > 0
    ? value
    : DEFAULT_REVIEW_PRICE_PAISE;
}

/** Revisions per custom draft. Each is a paid model call. */
export const MAX_DRAFT_REVISIONS = 5;

/** New custom drafts per customer per day, for the same reason. */
export const MAX_DRAFTS_PER_DAY = 10;

/** A generated document's title: its template's, or the draft's own. */
export function documentTitle(doc: {
  template?: { title: string } | null;
  title?: string | null;
}): string {
  return doc.template?.title ?? doc.title ?? "Custom document";
}
