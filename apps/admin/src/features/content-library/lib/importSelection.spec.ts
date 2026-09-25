import type { StorageObject } from "../api/contentLibraryApi";

import {
  folderState,
  groupByFolder,
  rupeesToPaise,
  toggleFolder,
} from "./importSelection";

const obj = (key: string, catalogued = false): StorageObject => ({
  key,
  sizeInBytes: 1024,
  lastModified: null,
  folder: key.slice(0, key.indexOf("/")),
  suggestedTitle: key,
  category: "LEGAL_PRACTICE",
  type: "FORM",
  catalogued,
});

describe("groupByFolder", () => {
  it("groups and puts the folder with most work first", () => {
    const groups = groupByFolder([
      obj("bails/a.docx"),
      obj("agreements/a.docx"),
      obj("agreements/b.docx"),
    ]);
    expect(groups.map((g) => g.folder)).toEqual(["agreements", "bails"]);
    expect(groups[0]?.importableCount).toBe(2);
  });

  it("counts catalogued separately from importable", () => {
    const [group] = groupByFolder([
      obj("x/a.docx", true),
      obj("x/b.docx"),
      obj("x/c.docx"),
    ]);
    expect(group?.cataloguedCount).toBe(1);
    expect(group?.importableCount).toBe(2);
  });
});

describe("toggleFolder", () => {
  /**
   * The bug this exists to prevent: selecting a folder that contains
   * already-imported files, then being told N were skipped with no way to
   * see which, because they looked selected too.
   */
  it("never selects a file that is already catalogued", () => {
    const [group] = groupByFolder([obj("x/a.docx", true), obj("x/b.docx")]);
    const selected = toggleFolder(new Set(), group!, true);
    expect([...selected]).toEqual(["x/b.docx"]);
  });

  it("deselecting clears only that folder", () => {
    const groups = groupByFolder([obj("x/a.docx"), obj("y/a.docx")]);
    let selected = new Set<string>();
    for (const g of groups) selected = toggleFolder(selected, g, true);
    expect(selected.size).toBe(2);

    const x = groups.find((g) => g.folder === "x")!;
    selected = toggleFolder(selected, x, false);
    expect([...selected]).toEqual(["y/a.docx"]);
  });
});

describe("folderState", () => {
  it("reports none, some and all", () => {
    const [group] = groupByFolder([obj("x/a.docx"), obj("x/b.docx")]);
    expect(folderState(new Set(), group!)).toBe("none");
    expect(folderState(new Set(["x/a.docx"]), group!)).toBe("some");
    expect(folderState(new Set(["x/a.docx", "x/b.docx"]), group!)).toBe("all");
  });

  // A fully-imported folder must not claim "all selected" when nothing is.
  it("stays none when every file is already catalogued", () => {
    const [group] = groupByFolder([obj("x/a.docx", true)]);
    expect(folderState(new Set(), group!)).toBe("none");
  });
});

describe("rupeesToPaise", () => {
  it.each([
    ["199", 19900],
    ["199.99", 19999],
    ["0", 0],
    ["1.5", 150],
  ])("%s -> %i paise", (input, expected) => {
    expect(rupeesToPaise(input)).toBe(expected);
  });

  // 199.99 * 100 is 19998.999999999996 in binary floating point. Storing that
  // would put a price of Rs 199.98999… on a product.
  it("rounds rather than truncating the float", () => {
    expect(rupeesToPaise("199.99")).toBe(19999);
    expect(Number.isInteger(rupeesToPaise("8.29"))).toBe(true);
  });

  it.each(["", "abc", "-5", "1.234", "1,000", " "])("rejects %j", (input) => {
    expect(rupeesToPaise(input)).toBeNull();
  });
});
