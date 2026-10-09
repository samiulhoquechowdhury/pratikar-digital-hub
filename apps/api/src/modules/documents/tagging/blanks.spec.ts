import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";

import { applyTags, extractBlanks, suggestFieldName } from "./blanks";

/**
 * Builds a .docx whose text is split across runs exactly the way Word splits
 * it — which is the only reason this code is more than a string replace.
 */
function docx(runs: string[]): Buffer {
  const zip = new PizZip();
  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`,
  );
  zip
    .folder("_rels")
    .file(
      ".rels",
      `<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`,
    );
  const body = runs
    .map((t) => `<w:r><w:t xml:space="preserve">${t}</w:t></w:r>`)
    .join("");
  zip
    .folder("word")
    .file(
      "document.xml",
      `<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p>${body}</w:p></w:body></w:document>`,
    );
  return zip.generate({ type: "nodebuffer" });
}

const textOf = (buffer: Buffer): string =>
  [
    ...new PizZip(buffer)
      .file("word/document.xml")!
      .asText()
      .matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g),
  ]
    .map((m) => m[1])
    .join("");

describe("extractBlanks", () => {
  it("finds each blank with the words around it", () => {
    const blanks = extractBlanks(
      docx([
        "I, Mr./Ms. _________, Son/Daughter/Wife of _________, aged about __ years",
      ]),
    );
    expect(blanks).toHaveLength(2);
    expect(blanks[0]?.before).toContain("I, Mr./Ms.");
    // The context is the whole point — "_______" says nothing on its own.
    expect(blanks[1]?.before).toContain("Son/Daughter/Wife of");
  });

  it("ignores a double underscore, which is usually not a field", () => {
    // "aged about __ years" is a two-character gap, not a fill-in line.
    const blanks = extractBlanks(docx(["aged about __ years and ____ months"]));
    expect(blanks).toHaveLength(1);
  });

  /**
   * The case that makes this more than a string replace: Word splits a
   * sentence across runs when formatting changes, sometimes mid-blank. 3.3%
   * of blanks in the real catalogue do this.
   */
  it("finds a blank that straddles two runs", () => {
    const blanks = extractBlanks(
      docx(["Signed by ______", "______ on this day"]),
    );
    expect(blanks).toHaveLength(1);
    expect(blanks[0]?.width).toBe(12);
    expect(blanks[0]?.after).toContain("on this day");
  });

  it("numbers blanks in reading order", () => {
    const blanks = extractBlanks(docx(["a ____ b ____ c ____"]));
    expect(blanks.map((b) => b.index)).toEqual([0, 1, 2]);
  });
});

describe("applyTags", () => {
  it("replaces only the blanks it was given", () => {
    const out = applyTags(docx(["Name: ______ Age: ______"]), [
      { index: 0, field: "fullName" },
    ]);
    const text = textOf(out);
    expect(text).toContain("{fullName}");
    // A part-converted form must still print and still be fillable by hand.
    expect(text).toContain("______");
  });

  it("writes a straddling blank as one tag, not one per run", () => {
    const out = applyTags(docx(["Signed by ______", "______ on this day"]), [
      { index: 0, field: "signatory" },
    ]);
    const text = textOf(out);
    expect(text).toBe("Signed by {signatory} on this day");
    // Tagging each covered run would repeat the field across the line.
    expect(text.match(/\{signatory\}/g)).toHaveLength(1);
  });

  it("keeps later blanks correct after an earlier one changes length", () => {
    // Edits run back-to-front for exactly this reason.
    const out = applyTags(docx(["a ____ b ________________ c ____"]), [
      { index: 0, field: "one" },
      { index: 1, field: "two" },
      { index: 2, field: "three" },
    ]);
    expect(textOf(out)).toBe("a {one} b {two} c {three}");
  });

  it("leaves the document untouched when nothing is assigned", () => {
    const original = docx(["Name: ______"]);
    expect(textOf(applyTags(original, []))).toBe(textOf(original));
  });
});

/**
 * The one that matters. A tagged document is worthless unless the generator
 * can actually fill it — this is the same library the worker uses.
 */
describe("round trip through docxtemplater", () => {
  it("produces a document the generator fills", () => {
    const tagged = applyTags(
      docx([
        "I, Mr./Ms. _________, Son/Daughter/Wife of ",
        "_________, residing at _________, affirm.",
      ]),
      [
        { index: 0, field: "fullName" },
        { index: 1, field: "guardianName" },
        { index: 2, field: "address" },
      ],
    );

    const template = new Docxtemplater(new PizZip(tagged), {
      paragraphLoop: true,
      linebreaks: true,
      nullGetter: () => "",
    });
    template.render({
      fullName: "Asha Rao",
      guardianName: "Ramesh Rao",
      address: "12 Park Street, Kolkata",
    });

    const filled = textOf(template.getZip().generate({ type: "nodebuffer" }));
    expect(filled).toContain("I, Mr./Ms. Asha Rao");
    expect(filled).toContain("Son/Daughter/Wife of Ramesh Rao");
    expect(filled).toContain("residing at 12 Park Street, Kolkata");
    expect(filled).not.toContain("_________");
  });
});

describe("suggestFieldName", () => {
  it("names a field from the words before the blank", () => {
    expect(
      suggestFieldName({
        index: 0,
        width: 9,
        before: "Son/Daughter/Wife of",
        after: "",
      }),
    ).toBe("daughterWifeOf");
  });

  it("falls back to a positional name when there is no context", () => {
    expect(
      suggestFieldName({ index: 4, width: 9, before: "", after: "" }),
    ).toBe("field5");
  });
});
