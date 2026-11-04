import { grossPaise, searchWithTypos, wordsOf } from "@pratikar/utils";

/** Every word of the search starts a word of the text — the website's rule. */
export const matchesWords = (haystack: string, query: string) => {
  const wanted = wordsOf(query);
  if (wanted.length === 0) return true;
  const have = wordsOf(haystack);
  return wanted.every((word) => have.some((w) => w.startsWith(word)));
};

/** Search that forgives typos; everything when there's no search. */
export const searchItems = <T>(
  items: T[],
  query: string,
  textOf: (item: T) => string,
): T[] =>
  query.trim()
    ? searchWithTypos(items, query.trim().toLowerCase(), textOf, matchesWords)
        .items
    : items;

/** Price bands on the GST-inclusive price, as on the website. */
export const PRICE_BANDS = [
  { value: "under-100", label: "Under ₹100", max: 100 },
  { value: "100-199", label: "₹100 – ₹199", max: 200 },
  { value: "200-499", label: "₹200 – ₹499", max: 500 },
  { value: "500-plus", label: "₹500 and above", max: Infinity },
] as const;

export const priceBand = (priceInPaise: number): string => {
  const rupees = grossPaise(priceInPaise) / 100;
  return PRICE_BANDS.find((band) => rupees < band.max)?.value ?? "500-plus";
};

export const SORTS = [
  { value: "title", label: "Title A–Z" },
  { value: "newest", label: "Newest first" },
  { value: "price-low", label: "Price: low to high" },
  { value: "price-high", label: "Price: high to low" },
] as const;

export type SortValue = (typeof SORTS)[number]["value"];

interface Sortable {
  title: string;
  priceInPaise: number;
  createdAt: string;
}

export const sortItems = <T extends Sortable>(
  items: T[],
  sort: SortValue,
): T[] =>
  [...items].sort((a, b) => {
    switch (sort) {
      case "newest":
        return b.createdAt.localeCompare(a.createdAt);
      case "price-low":
        return a.priceInPaise - b.priceInPaise;
      case "price-high":
        return b.priceInPaise - a.priceInPaise;
      default:
        return a.title.localeCompare(b.title);
    }
  });
