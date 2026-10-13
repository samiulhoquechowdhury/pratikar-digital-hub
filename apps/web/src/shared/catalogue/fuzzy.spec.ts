import { matchesWords } from "./browse";
import {
  correctQuery,
  editDistance,
  matchesWordsFuzzy,
  searchWithTypos,
  wordCloseness,
} from "./fuzzy";

const TITLES = [
  "General Affidavit",
  "Rent Agreement",
  "Partnership Deed",
  "Power of Attorney",
  "Legal Notice for Unpaid Rent",
  "Last Will and Testament",
  "Bill of Sale",
];

const search = (query: string) =>
  searchWithTypos(TITLES, query, (title) => title, matchesWords);

describe("editDistance", () => {
  it("counts a swap of neighbouring letters as one edit", () => {
    expect(editDistance("agreemnet", "agreement")).toBe(1);
  });

  it("counts insertions, deletions and substitutions", () => {
    expect(editDistance("afidavit", "affidavit")).toBe(1);
    expect(editDistance("atorney", "attorney")).toBe(1);
    expect(editDistance("pawer", "power")).toBe(1);
  });
});

describe("wordCloseness", () => {
  it("keeps the exact prefix rule", () => {
    expect(wordCloseness("agree", "agreement")).toBe(0);
  });

  it("finds a longer word from a misspelt start", () => {
    expect(wordCloseness("agrem", "agreement")).not.toBeNull();
  });

  it("keeps short words exact, so 'will' never finds 'bill'", () => {
    expect(wordCloseness("wil", "bill")).toBeNull();
    expect(matchesWordsFuzzy("Bill of Sale", "wil")).toBe(false);
  });
});

describe("searchWithTypos", () => {
  it.each([
    ["afidavit", "General Affidavit"],
    ["rent agrement", "Rent Agreement"],
    ["partnersip deed", "Partnership Deed"],
    ["pawer of atorney", "Power of Attorney"],
    ["legal notise", "Legal Notice for Unpaid Rent"],
  ])("finds %s despite the spelling", (query, title) => {
    const result = search(query);
    expect(result.items).toContain(title);
    expect(result.fuzzy).toBe(true);
  });

  it("uses exact matches only when the search is spelt right", () => {
    const result = search("rent");
    expect(result.fuzzy).toBe(false);
    expect(result.items).toEqual([
      "Rent Agreement",
      "Legal Notice for Unpaid Rent",
    ]);
  });

  it("still finds nothing for nonsense", () => {
    expect(search("xyzzyq").items).toEqual([]);
  });
});

describe("correctQuery", () => {
  it("re-spells the search with the catalogue's words", () => {
    expect(correctQuery("rent agrement", TITLES)).toBe("rent agreement");
    expect(correctQuery("pawer of atorney", TITLES)).toBe("power of attorney");
  });

  it("returns null when nothing needs correcting", () => {
    expect(correctQuery("rent agreement", TITLES)).toBeNull();
  });
});
