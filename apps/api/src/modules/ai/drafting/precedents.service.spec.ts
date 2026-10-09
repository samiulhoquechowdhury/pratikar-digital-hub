import PizZip from "pizzip";

import type { FormHit } from "../knowledge-base/knowledge-base-search.service";

import { PrecedentFinder, pickPrecedents } from "./precedents.service";

const hit = (title: string, score: number): FormHit => ({
  id: title.toLowerCase().replace(/\s+/g, "-"),
  title,
  fileUrl: `library/${title}.docx`,
  score,
});

const docx = (text: string) => {
  const zip = new PizZip();
  zip.file(
    "word/document.xml",
    `<w:document><w:body><w:p><w:r><w:t>${text}</w:t></w:r></w:p></w:body></w:document>`,
  );
  return zip.generate({ type: "nodebuffer" });
};

describe("pickPrecedents", () => {
  it("takes the runner-up only when it is nearly as close", () => {
    // Measured: Partnership Deed brings the co-founder deed along...
    expect(
      pickPrecedents([
        hit("Partnership Deed", 0.585),
        hit("Deed of Co Founder Agreement", 0.543),
        hit("Deed of LLP Agreement", 0.515),
      ]).map((p) => p.title),
    ).toEqual(["Partnership Deed", "Deed of Co Founder Agreement"]);
    // ...but a leave and licence agreement doesn't bring a leave application.
    expect(
      pickPrecedents([
        hit("Leave and Licence Agreement", 0.545),
        hit("Leave Application Form", 0.488),
      ]).map((p) => p.title),
    ).toEqual(["Leave and Licence Agreement"]);
  });

  it("counts a form uploaded twice once", () => {
    expect(
      pickPrecedents([
        hit("Legal Notice for Recovery", 0.45),
        { ...hit("Legal Notice for Recovery", 0.45), id: "dup" },
      ]),
    ).toHaveLength(1);
  });

  it("finds nothing in nothing", () => {
    expect(pickPrecedents([])).toEqual([]);
  });
});

describe("PrecedentFinder", () => {
  const build = (hits: FormHit[] | Error, configured = true) => {
    const search = {
      isConfigured: configured,
      searchForms: jest.fn(() =>
        hits instanceof Error ? Promise.reject(hits) : Promise.resolve(hits),
      ),
    };
    const storage = {
      read: jest.fn(() => Promise.resolve(docx("THIS DEED OF PARTNERSHIP"))),
    };
    return {
      finder: new PrecedentFinder(search as never, storage as never),
      search,
      storage,
    };
  };
  const brief = {
    documentType: "Partnership deed",
    details: "Two partners, Pune",
  };

  it("searches by the document's name and returns the forms' text", async () => {
    const { finder, search } = build([hit("Partnership Deed", 0.58)]);

    const [precedent] = await finder.find(brief);

    expect(search.searchForms).toHaveBeenCalledWith("Partnership deed", 4);
    expect(precedent).toMatchObject({
      title: "Partnership Deed",
      text: "THIS DEED OF PARTNERSHIP",
    });
  });

  it("reads a form once, however many drafts use it", async () => {
    const { finder, storage } = build([hit("Partnership Deed", 0.58)]);

    await finder.find(brief);
    await finder.find(brief);

    expect(storage.read).toHaveBeenCalledTimes(1);
  });

  // The draft goes ahead without a precedent rather than failing.
  it("returns none when the search fails or isn't configured", async () => {
    await expect(
      build(new Error("voyage down")).finder.find(brief),
    ).resolves.toEqual([]);
    await expect(build([], false).finder.find(brief)).resolves.toEqual([]);
  });

  it("reloads a draft's own references for a revision", async () => {
    const { finder, search } = build([]);

    const precedents = await finder.load([
      { id: "f1", title: "Partnership Deed", fileUrl: "library/p.docx" },
    ]);

    expect(precedents).toHaveLength(1);
    expect(search.searchForms).not.toHaveBeenCalled();
  });
});
