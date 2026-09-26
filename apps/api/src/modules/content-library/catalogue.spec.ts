import { ContentCategory, ContentType } from "@prisma/client";

import {
  folderOf,
  isAppWritten,
  isSellable,
  suggestionFor,
  titleFromKey,
} from "./catalogue";

/**
 * These titles go on product pages, so they are worth pinning against the
 * real filenames in the bucket rather than invented ones. Every key below is
 * taken from the live catalogue.
 */
describe("titleFromKey", () => {
  it.each([
    ["affidavits/ADDRESS PROOF AFFIDAVIT.docx", "Address Proof Affidavit"],
    ["affidavits/name correction affidavit.docx", "Name Correction Affidavit"],
    [
      "agreements/ACCOUNTING SERVICES AGREEMENT.docx",
      "Accounting Services Agreement",
    ],
    [
      "agreements/AGREEMENT TO SELL AGREEMENT.docx",
      "Agreement to Sell Agreement",
    ],
    ["bails/BAIL BOND.docx", "Bail Bond"],
  ])("%s -> %s", (key, expected) => {
    expect(titleFromKey(key)).toBe(expected);
  });

  /**
   * The files carry internal project tags. "(DAMANTI)" is meaningless to a
   * buyer and printing it on the storefront would look like a mistake,
   * because it is one.
   */
  it("drops the internal project tag", () => {
    expect(
      titleFromKey("agreements/AGENCY AGREEMENT PROJECT (DAMANTI).docx"),
    ).toBe("Agency Agreement Project");
  });

  it("keeps initialisms upper-case rather than title-casing them", () => {
    expect(titleFromKey("agreements/NDA AGREEMENT.docx")).toBe("NDA Agreement");
    expect(titleFromKey("affidavits/NOC AFFIDAVIT.docx")).toBe("NOC Affidavit");
    expect(titleFromKey("checklist/GST FILING.docx")).toBe("GST Filing");
  });

  it("lower-cases joining words, except when they lead", () => {
    expect(titleFromKey("x/POWER OF ATTORNEY.docx")).toBe("Power of Attorney");
    expect(titleFromKey("x/OF COUNSEL.docx")).toBe("Of Counsel");
  });

  it("handles separators and numbers", () => {
    expect(titleFromKey("froms/form_16_part-b.docx")).toBe("Form 16 Part B");
  });

  it("never returns an empty title for a real file", () => {
    for (const key of ["a/b.docx", "x.pdf", "deep/nested/path/DOC.docx"]) {
      expect(titleFromKey(key).length).toBeGreaterThan(0);
    }
  });
});

describe("suggestionFor", () => {
  it.each([
    ["agreements/x.docx", ContentCategory.LEGAL_PRACTICE, ContentType.FORM],
    [
      "checklist/x.docx",
      ContentCategory.CHECKLISTS_REFERENCE,
      ContentType.CHECKLIST,
    ],
    ["e-books/x.docx", ContentCategory.BUSINESS_COMPLIANCE, ContentType.EBOOK],
  ])("classifies %s", (key, category, type) => {
    expect(suggestionFor(key)).toEqual({ category, type });
  });

  // The bucket really does have a folder spelled "froms".
  it("handles the misspelled forms folder", () => {
    expect(suggestionFor("froms/x.docx").type).toBe(ContentType.FORM);
  });

  it("falls back for an unknown folder instead of guessing a category", () => {
    expect(suggestionFor("something-new/x.docx")).toEqual({
      category: ContentCategory.LEGAL_PRACTICE,
      type: ContentType.FORM,
    });
  });
});

describe("folderOf / isSellable", () => {
  it("reads the top-level folder", () => {
    expect(folderOf("agreements/a/b.docx")).toBe("agreements");
    expect(folderOf("loose.docx")).toBe("");
  });

  it("accepts what a customer can open and rejects the rest", () => {
    expect(isSellable("a/b.docx")).toBe(true);
    expect(isSellable("a/b.PDF")).toBe(true);
    // Zero-byte folder markers and stray files must never become products.
    expect(isSellable("a/b.txt")).toBe(false);
    expect(isSellable("agreements/")).toBe(false);
  });
});

describe("isAppWritten", () => {
  it.each([
    "documents/3f2a.docx",
    "templates/1790000000000-A.docx",
    "invoices/9c1b.pdf",
    "credit-notes/77aa.pdf",
  ])("recognises %p as the app's own output", (key) => {
    expect(isAppWritten(key)).toBe(true);
  });

  it.each([
    "affidavits/GENERAL AFFIDAVIT.docx",
    "loose.pdf",
    // A prefix, not a substring: an uploaded folder that merely contains
    // the word is still stock.
    "legal-documents/notice.docx",
    "e-books/invoices-explained.pdf",
  ])("leaves %p alone", (key) => {
    expect(isAppWritten(key)).toBe(false);
  });
});
