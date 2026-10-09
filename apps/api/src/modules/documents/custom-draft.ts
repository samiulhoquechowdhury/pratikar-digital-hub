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
