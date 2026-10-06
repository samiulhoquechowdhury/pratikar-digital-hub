/**
 * Faceted browsing for a catalogue, as pure functions: filter by any mix of
 * facets, search by words, sort, page — and count what each filter option
 * would leave, so the sidebar can say "Forms (330)" before anyone clicks.
 *
 * Kept free of React so the rules a shopper relies on — that a count is
 * what clicking gives you, that "deed sale" finds "Sale Deed" — are tested
 * directly.
 */

export interface FacetOption {
  value: string;
  label: string;
}

export interface FacetDef<T> {
  /** Also the URL parameter, e.g. "shelf" or "category". */
  id: string;
  label: string;
  options: FacetOption[];
  /** The option values an item belongs to (usually one). */
  valuesOf: (item: T) => string[];
}

export interface SortDef<T> {
  id: string;
  label: string;
  compare: (a: T, b: T) => number;
}

export interface BrowseQuery {
  q: string;
  /** Facet id → chosen value; a missing facet means "any". */
  filters: Record<string, string>;
  sort: string;
  page: number;
  pageSize: number;
}

export interface BrowseResult<T> {
  /** The current page of matches. */
  items: T[];
  /** Matches across every page. */
  total: number;
  pageCount: number;
  /** The page actually shown — clamped when filters shrink the results. */
  page: number;
  /** facet id → option value → how many matches choosing it would give. */
  counts: Record<string, Record<string, number>>;
}

/** Lower-case words, punctuation dropped: "Sale-Deed (2026)" → sale, deed, 2026. */
export const wordsOf = (text: string): string[] =>
  text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);

/**
 * True when every word of the query starts a word of the text, in any order:
 * "deed sale" finds "Sale Deed", "agree" finds "Agreement". A query of
 * nothing matches everything.
 */
export function matchesWords(text: string, query: string): boolean {
  const wanted = wordsOf(query);
  if (wanted.length === 0) return true;
  const have = wordsOf(text);
  return wanted.every((word) => have.some((w) => w.startsWith(word)));
}

export function browse<T>(
  all: T[],
  query: BrowseQuery,
  options: {
    facets: FacetDef<T>[];
    sorts: SortDef<T>[];
    /** The text a search looks in — title, plus anything else worth finding by. */
    searchText: (item: T) => string;
  },
): BrowseResult<T> {
  const { facets, sorts, searchText } = options;
  const searched = all.filter((item) =>
    matchesWords(searchText(item), query.q),
  );

  const passes = (item: T, except?: string) =>
    facets.every((facet) => {
      if (facet.id === except) return true;
      const chosen = query.filters[facet.id];
      return !chosen || facet.valuesOf(item).includes(chosen);
    });

  // Each facet's counts apply every *other* filter, so an option's number is
  // exactly what choosing it — in place of the current choice — would show.
  const counts: BrowseResult<T>["counts"] = {};
  for (const facet of facets) {
    const tally: Record<string, number> = {};
    for (const item of searched) {
      if (!passes(item, facet.id)) continue;
      for (const value of facet.valuesOf(item)) {
        tally[value] = (tally[value] ?? 0) + 1;
      }
    }
    counts[facet.id] = tally;
  }

  const sort = sorts.find((s) => s.id === query.sort) ?? sorts[0];
  const matched = searched.filter((item) => passes(item));
  if (sort) matched.sort(sort.compare);

  const pageCount = Math.max(1, Math.ceil(matched.length / query.pageSize));
  const page = Math.min(Math.max(1, query.page), pageCount);
  return {
    items: matched.slice((page - 1) * query.pageSize, page * query.pageSize),
    total: matched.length,
    pageCount,
    page,
    counts,
  };
}

/**
 * The page numbers a pager shows: the first, the last, and a window around
 * the current page, with null where pages are skipped — 1 … 4 5 6 … 14.
 */
export function pageWindow(page: number, pageCount: number): (number | null)[] {
  const shown = new Set(
    [1, pageCount, page - 1, page, page + 1].filter(
      (p) => p >= 1 && p <= pageCount,
    ),
  );
  const sorted = [...shown].sort((a, b) => a - b);
  const out: (number | null)[] = [];
  for (const [i, p] of sorted.entries()) {
    const prev = sorted[i - 1];
    if (prev !== undefined && p - prev > 1)
      out.push(p - prev === 2 ? p - 1 : null);
    out.push(p);
  }
  return out;
}
