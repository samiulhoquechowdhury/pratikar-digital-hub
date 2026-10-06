import type { KnowledgeHit } from "../knowledge-base/knowledge-base-search.service";

import { SYSTEM_PROMPT, catalogueBlock, citedHits } from "./chat.prompt";

const hit = (
  title: string,
  patch: Partial<KnowledgeHit> = {},
): KnowledgeHit => ({
  sourceType: "template",
  sourceId: title.toLowerCase(),
  title,
  priceInPaise: 34900,
  href: `/documents/${title.toLowerCase()}`,
  kind: "Document template",
  content: `${title}\nA document template.`,
  score: 0.6,
  ...patch,
});

describe("SYSTEM_PROMPT", () => {
  // Anything per-request in here would break caching on every call.
  it("contains nothing that changes between requests", () => {
    expect(SYSTEM_PROMPT).not.toMatch(/\d{4}-\d{2}-\d{2}|<catalogue>\n\[/);
  });
});

describe("catalogueBlock", () => {
  it("numbers the hits and quotes the live price, before GST", () => {
    const block = catalogueBlock([hit("Rent Agreement"), hit("NDA")]);

    expect(block).toContain(
      "[1] Rent Agreement (Document template) — ₹349.00 + GST",
    );
    expect(block).toContain("[2] NDA");
    expect(block.startsWith("<catalogue>")).toBe(true);
  });

  // Said explicitly, so the model answers "we don't have that" rather than
  // reaching for something from its own knowledge.
  it("says so when nothing matched", () => {
    expect(catalogueBlock([])).toContain("No items matched");
  });
});

describe("citedHits", () => {
  const hits = [hit("A"), hit("B"), hit("C")];

  it("returns only what the answer cites, in first-cited order", () => {
    const cited = citedHits(
      "Try [3], or [1] if you rent. [3] is cheaper.",
      hits,
    );

    expect(cited.map((h) => h.title)).toEqual(["C", "A"]);
  });

  it("ignores numbers that point at nothing", () => {
    expect(citedHits("See [0] and [9].", hits)).toEqual([]);
  });

  it("returns nothing when nothing is cited", () => {
    expect(citedHits("We don't have that.", hits)).toEqual([]);
  });
});
