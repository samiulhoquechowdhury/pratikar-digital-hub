import type { TemplateField } from "@pratikar/types";

import { fieldsOf, isRealDate, validateAnswers } from "./filled-data";

const FIELDS: TemplateField[] = [
  { key: "landlord", label: "Landlord's name", type: "text", required: true },
  { key: "rent", label: "Monthly rent", type: "number", required: true },
  { key: "start", label: "Start date", type: "date", required: true },
  {
    key: "furnished",
    label: "Furnishing",
    type: "select",
    required: false,
    options: [
      { value: "furnished", label: "Furnished" },
      { value: "unfurnished", label: "Unfurnished" },
    ],
  },
  { key: "notes", label: "Notes", type: "textarea", required: false },
];

const valid = {
  landlord: "  R. Sharma  ",
  rent: "18,000",
  start: "2026-11-01",
  furnished: "furnished",
};

describe("validateAnswers", () => {
  it("normalises good answers to what the document should print", () => {
    const { clean, problems } = validateAnswers(FIELDS, valid);

    expect(problems).toEqual([]);
    expect(clean).toEqual({
      landlord: "R. Sharma",
      rent: 18000,
      start: "2026-11-01",
      furnished: "furnished",
    });
  });

  it("reports each missing required answer by name", () => {
    const { problems } = validateAnswers(FIELDS, {
      ...valid,
      landlord: " ",
      rent: undefined,
    });

    expect(problems).toEqual([
      { key: "landlord", label: "Landlord's name", problem: "missing" },
      { key: "rent", label: "Monthly rent", problem: "missing" },
    ]);
  });

  // The cleared-number-box bug: 0 is a real answer, "" is not.
  it("keeps 0 as an answer but treats an empty string as missing", () => {
    expect(validateAnswers(FIELDS, { ...valid, rent: 0 }).clean.rent).toBe(0);
    expect(
      validateAnswers(FIELDS, { ...valid, rent: "" }).problems[0]?.problem,
    ).toBe("missing");
  });

  it.each([
    [{ rent: "eighteen thousand" }, "rent", "not-a-number"],
    [{ start: "01/11/2026" }, "start", "not-a-date"],
    [{ start: "2026-02-30" }, "start", "not-a-date"],
    [{ furnished: "semi" }, "furnished", "not-an-option"],
    [{ landlord: "x".repeat(501) }, "landlord", "too-long"],
  ])("rejects %p", (patch, key, problem) => {
    const { problems, clean } = validateAnswers(FIELDS, { ...valid, ...patch });

    expect(problems).toEqual([expect.objectContaining({ key, problem })]);
    expect(clean[key]).toBeUndefined();
  });

  it("leaves out blank optional answers and keys the template doesn't have", () => {
    const { clean } = validateAnswers(FIELDS, {
      ...valid,
      notes: "",
      injected: "<script>",
    });

    expect(Object.keys(clean).sort()).toEqual([
      "furnished",
      "landlord",
      "rent",
      "start",
    ]);
  });
});

describe("isRealDate", () => {
  it.each([
    ["2026-11-01", true],
    ["2024-02-29", true],
    ["2026-02-29", false],
    ["2026-13-01", false],
    ["26-11-01", false],
  ])("%s -> %s", (value, expected) => {
    expect(isRealDate(value)).toBe(expected);
  });
});

describe("fieldsOf", () => {
  it("keeps well-formed fields and drops anything else in the Json column", () => {
    expect(
      fieldsOf([
        FIELDS[0],
        { key: "x" },
        null,
        { key: "y", label: "Y", type: "colour", required: true },
      ]),
    ).toEqual([FIELDS[0]]);
    expect(fieldsOf({ not: "an array" })).toEqual([]);
  });
});
