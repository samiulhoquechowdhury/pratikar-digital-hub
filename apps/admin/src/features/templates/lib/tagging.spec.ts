import type { StoredBlank, TaggableObject } from "../api/templatesApi";

import {
  groupByFolder,
  hasProblems,
  matchesSearch,
  setAllIncluded,
  toPayloadFields,
  toRows,
  updateRow,
  validateRows,
  type BlankRow,
} from "./tagging";

const blank = (patch: Partial<StoredBlank> = {}): StoredBlank => ({
  index: 0,
  width: 20,
  before: "I, ",
  after: ", son of",
  suggestedField: "name",
  suggestedLabel: "Name",
  suggestedType: "text",
  ...patch,
});

const rows = (...patches: Partial<BlankRow>[]): BlankRow[] =>
  patches.map((patch, i) => ({
    index: i,
    width: 20,
    before: "",
    after: "",
    include: true,
    key: `field${i}`,
    label: `Field ${i}`,
    type: "text" as const,
    required: true,
    ...patch,
  }));

describe("toRows", () => {
  it("pre-fills every suggestion and includes everything", () => {
    const [row] = toRows([
      blank({ index: 3, suggestedField: "fatherName", suggestedType: "date" }),
    ]);

    expect(row).toMatchObject({
      index: 3,
      include: true,
      key: "fatherName",
      label: "Name",
      type: "date",
      required: true,
    });
  });

  it("keeps the context so the operator can see what the blank is for", () => {
    const [row] = toRows([blank({ before: "dated ", after: " at Kolkata" })]);

    expect(row?.before).toBe("dated ");
    expect(row?.after).toBe(" at Kolkata");
  });
});

describe("updateRow", () => {
  // Rows are addressed by their index in the *document*, not their position
  // on screen — the two diverge as soon as the list is filtered or reordered.
  it("edits by source index, not array position", () => {
    const list = rows({ index: 10 }, { index: 20 });

    const next = updateRow(list, 20, { key: "renamed" });

    expect(next[0]?.key).toBe("field0");
    expect(next[1]?.key).toBe("renamed");
  });

  it("leaves the original alone", () => {
    const list = rows({ index: 0 });
    updateRow(list, 0, { key: "changed" });
    expect(list[0]?.key).toBe("field0");
  });
});

describe("validateRows", () => {
  it("passes a well-formed set", () => {
    expect(hasProblems(validateRows(rows({}, {})))).toBe(false);
  });

  it("refuses a set with nothing ticked", () => {
    const problems = validateRows(rows({ include: false }));

    expect(problems.general).toHaveLength(1);
    expect(problems.general[0]).toContain("at least one blank");
  });

  it("reports a bad key against the row that has it", () => {
    const problems = validateRows(rows({}, { index: 1, key: "2nd party" }));

    expect(problems.byRow.get(0)).toBeUndefined();
    expect(problems.byRow.get(1)?.[0]).toContain("isn't a valid key");
  });

  it("catches duplicate keys, which the API's per-field validation cannot", () => {
    const problems = validateRows(rows({ key: "name" }, { key: "name" }));

    expect(problems.byRow.get(1)?.[0]).toContain("Duplicate key");
  });

  /**
   * The regression this guards: problems come back indexed against the
   * included subset. Excluding an early row shifts every later one, and a
   * naive mapping would pin the message to the wrong blank.
   */
  it("maps problems back past excluded rows", () => {
    const problems = validateRows(
      rows(
        { index: 0, include: false },
        { index: 1, include: false },
        { index: 2, key: "not valid" },
      ),
    );

    expect(problems.byRow.has(2)).toBe(true);
    expect(problems.byRow.has(0)).toBe(false);
  });

  it("ignores an excluded row's broken key", () => {
    const problems = validateRows(rows({}, { key: "", include: false }));

    expect(hasProblems(problems)).toBe(false);
  });
});

describe("toPayloadFields", () => {
  it("sends only what is ticked, tagged by source index", () => {
    const fields = toPayloadFields(
      rows({ index: 0 }, { index: 1, include: false }, { index: 2 }),
    );

    expect(fields.map((f) => f.index)).toEqual([0, 2]);
  });

  it("trims, so a stray space can't produce a tag that never matches", () => {
    const [field] = toPayloadFields(rows({ key: " name ", label: " Name " }));

    expect(field?.key).toBe("name");
    expect(field?.label).toBe("Name");
  });
});

describe("setAllIncluded", () => {
  it("toggles every row at once", () => {
    const next = setAllIncluded(
      rows({ include: false }, { include: true }),
      true,
    );
    expect(next.every((r) => r.include)).toBe(true);
  });
});

describe("groupByFolder", () => {
  const object = (key: string, folder: string): TaggableObject => ({
    key,
    sizeInBytes: 1,
    lastModified: null,
    folder,
    suggestedTitle: key,
    template: null,
  });

  it("groups by folder and sorts the groups", () => {
    const groups = groupByFolder([
      object("notices/a.docx", "notices"),
      object("affidavits/b.docx", "affidavits"),
      object("affidavits/c.docx", "affidavits"),
    ]);

    expect(groups.map((g) => g.folder)).toEqual(["affidavits", "notices"]);
    expect(groups[0]?.objects).toHaveLength(2);
  });

  it("gives loose files at the bucket root a name rather than an empty heading", () => {
    const groups = groupByFolder([object("loose.docx", "")]);

    expect(groups[0]?.folder).toBe("(no folder)");
  });
});

describe("matchesSearch", () => {
  const object: TaggableObject = {
    key: "affidavits/GENERAL AFFIDAVIT.docx",
    sizeInBytes: 1,
    lastModified: null,
    folder: "affidavits",
    suggestedTitle: "General Affidavit",
    template: null,
  };

  it.each(["general", "GENERAL", "affidavits", "  affidavit  "])(
    "matches %p",
    (query) => {
      expect(matchesSearch(object, query)).toBe(true);
    },
  );

  it("matches everything on an empty query", () => {
    expect(matchesSearch(object, "")).toBe(true);
  });

  it("rejects a miss", () => {
    expect(matchesSearch(object, "rent agreement")).toBe(false);
  });
});
