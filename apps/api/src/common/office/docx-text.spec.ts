import PizZip from "pizzip";

import { docxToText } from "./docx-text";

/** A minimal .docx holding this body XML. */
const docx = (body: string) => {
  const zip = new PizZip();
  zip.file(
    "word/document.xml",
    `<?xml version="1.0"?><w:document xmlns:w="w"><w:body>${body}</w:body></w:document>`,
  );
  return zip.generate({ type: "nodebuffer" });
};

const p = (...runs: string[]) =>
  `<w:p>${runs.map((r) => (r.startsWith("<") ? r : `<w:r><w:t xml:space="preserve">${r}</w:t></w:r>`)).join("")}</w:p>`;

describe("docxToText", () => {
  it("gives one line per paragraph, joining runs Word split mid-sentence", () => {
    expect(docxToText(docx(p("I, Mr. ", "Asha", " Rao") + p("of Pune")))).toBe(
      "I, Mr. Asha Rao\nof Pune",
    );
  });

  it("keeps tabs and line breaks, and decodes entities", () => {
    expect(
      docxToText(
        docx(p("1.", "<w:tab/>", "Rent &amp; deposit", "<w:br/>", "next")),
      ),
    ).toBe("1.\tRent & deposit\nnext");
  });

  it("collapses runs of empty paragraphs", () => {
    expect(docxToText(docx(p("a") + p() + p() + p() + p("b")))).toBe("a\n\nb");
  });

  it("refuses something that isn't a Word document", () => {
    const zip = new PizZip();
    zip.file("x.txt", "x");
    expect(() => docxToText(zip.generate({ type: "nodebuffer" }))).toThrow(
      "Not a Word document",
    );
  });
});
