import { browse, matchesWords, pageWindow, type FacetDef } from "./browse";

interface Item {
  title: string;
  type: string;
  topic: string;
  price: number;
}

const ITEMS: Item[] = [
  { title: "Sale Deed", type: "form", topic: "property", price: 149 },
  { title: "Gift Deed", type: "form", topic: "property", price: 149 },
  {
    title: "Rent Agreement Checklist",
    type: "checklist",
    topic: "property",
    price: 99,
  },
  {
    title: "GST Filing Checklist",
    type: "checklist",
    topic: "business",
    price: 99,
  },
  {
    title: "Company Law Handbook",
    type: "ebook",
    topic: "business",
    price: 299,
  },
];

const FACETS: FacetDef<Item>[] = [
  {
    id: "type",
    label: "Type",
    options: [],
    valuesOf: (i) => [i.type],
  },
  {
    id: "topic",
    label: "Topic",
    options: [],
    valuesOf: (i) => [i.topic],
  },
];

const run = (
  q: string,
  filters: Record<string, string> = {},
  page = 1,
  pageSize = 10,
) =>
  browse(
    ITEMS,
    { q, filters, sort: "title", page, pageSize },
    {
      facets: FACETS,
      sorts: [
        {
          id: "title",
          label: "A–Z",
          compare: (a, b) => a.title.localeCompare(b.title),
        },
      ],
      searchText: (i) => i.title,
    },
  );

describe("matchesWords", () => {
  it.each([
    ["Sale Deed", "deed sale", true],
    ["Rent Agreement", "agree", true],
    ["Rent Agreement", "rent  agr", true],
    ["Rent Agreement", "lease", false],
    ["Sale-Deed (2026)", "2026", true],
    ["Anything", "   ", true],
  ])("%s / %p → %s", (text, query, expected) => {
    expect(matchesWords(text, query)).toBe(expected);
  });
});

describe("browse", () => {
  it("combines facets", () => {
    const result = run("", { type: "checklist", topic: "property" });
    expect(result.items.map((i) => i.title)).toEqual([
      "Rent Agreement Checklist",
    ]);
  });

  // The number beside an option is what clicking it would give.
  it("counts each facet with every other filter applied", () => {
    const result = run("", { type: "checklist" });
    expect(result.counts.topic).toEqual({ property: 1, business: 1 });
    // Type's own counts ignore the type filter, so switching is predictable.
    expect(result.counts.type).toEqual({ form: 2, checklist: 2, ebook: 1 });
  });

  it("counts within the search", () => {
    expect(run("deed").counts.type).toEqual({ form: 2 });
  });

  it("pages, and pulls a page beyond the end back to the last", () => {
    // A–Z: Company…, Gift…, GST…, Rent…, Sale… — page 2 is the 3rd and 4th.
    expect(run("", {}, 2, 2).items.map((i) => i.title)).toEqual([
      "GST Filing Checklist",
      "Rent Agreement Checklist",
    ]);
    const beyond = run("", { type: "ebook" }, 7, 2);
    expect(beyond.page).toBe(1);
    expect(beyond.items).toHaveLength(1);
  });

  it("reports one empty page when nothing matches", () => {
    const empty = run("zzz");
    expect(empty).toMatchObject({ total: 0, pageCount: 1, page: 1, items: [] });
  });
});

describe("pageWindow", () => {
  it.each([
    [1, 1, [1]],
    [1, 3, [1, 2, 3]],
    [5, 14, [1, null, 4, 5, 6, null, 14]],
    [1, 14, [1, 2, null, 14]],
    [14, 14, [1, null, 13, 14]],
    // A gap of one page shows the page rather than "…".
    [4, 14, [1, 2, 3, 4, 5, null, 14]],
  ])("page %i of %i", (page, count, expected) => {
    expect(pageWindow(page, count)).toEqual(expected);
  });
});
