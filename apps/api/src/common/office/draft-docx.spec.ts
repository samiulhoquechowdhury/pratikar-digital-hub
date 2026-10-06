import PizZip from "pizzip";

import { draftToDocx } from "./draft-docx";

/** The document's body XML, to read back what was laid out. */
async function bodyOf(
  blocks: {
    kind: "heading" | "paragraph" | "clause" | "signature";
    text: string;
  }[],
) {
  const docx = await draftToDocx({
    title: "Affidavit",
    blocks,
    missingDetails: [],
    summary: "",
    declined: null,
  });
  return new PizZip(docx).file("word/document.xml")!.asText();
}

describe("draftToDocx", () => {
  it("numbers clauses in order, so a revision can't leave a gap", async () => {
    const xml = await bodyOf([
      { kind: "clause", text: "First." },
      { kind: "paragraph", text: "Between." },
      { kind: "clause", text: "Second." },
    ]);
    expect(xml).toMatch(
      /1\.<\/w:t>[\s\S]*First\.[\s\S]*2\.<\/w:t>[\s\S]*Second\./,
    );
  });

  it("puts the title first, in capitals", async () => {
    const xml = await bodyOf([{ kind: "paragraph", text: "Body." }]);
    expect(xml.indexOf("AFFIDAVIT")).toBeLessThan(xml.indexOf("Body."));
  });

  // A justified paragraph with breaks stretches the lines before them.
  it("lays out each line of a paragraph as its own paragraph", async () => {
    const xml = await bodyOf([{ kind: "paragraph", text: "One\nTwo" }]);
    expect(xml).not.toContain("<w:br/>");
    expect(xml.match(/<w:p>|<w:p /g)!.length).toBeGreaterThanOrEqual(3);
  });
});
