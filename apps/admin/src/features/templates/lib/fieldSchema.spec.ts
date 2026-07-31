import type { TemplateField, TemplateFieldSchema } from "@pratikar/types";

import {
  moveField,
  paiseToRupees,
  rupeesToPaise,
  updateField,
  validateFieldSchema,
} from "./fieldSchema";

const field = (overrides: Partial<TemplateField> = {}): TemplateField => ({
  key: "landlordName",
  label: "Landlord's full name",
  type: "text",
  required: true,
  ...overrides,
});

describe("validateFieldSchema", () => {
  it("accepts a well-formed schema", () => {
    const schema: TemplateFieldSchema = [
      field(),
      field({ key: "tenantName", label: "Tenant" }),
    ];
    expect(validateFieldSchema(schema)).toEqual([]);
  });

  it("rejects an empty schema, which would generate a document with nothing filled in", () => {
    expect(validateFieldSchema([])).toHaveLength(1);
  });

  // The failure this guards against is silent: docxtemplater fills by plain
  // property lookup, so the second field's value simply overwrites the first
  // and one of the customer's answers disappears from the document.
  it("rejects duplicate keys and names the field that already used it", () => {
    const schema = [field(), field({ label: "Second" })];
    const problems = validateFieldSchema(schema);

    expect(problems).toHaveLength(1);
    expect(problems[0]?.index).toBe(1);
    expect(problems[0]?.message).toContain("Duplicate key");
    expect(problems[0]?.message).toContain("field 1");
  });

  it.each([
    ["landlord name", "spaces"],
    ["landlord-name", "hyphens"],
    ["1stParty", "a leading digit"],
    ["{landlordName}", "brace characters"],
  ])("rejects the key %p (%s)", (key) => {
    const problems = validateFieldSchema([field({ key })]);
    expect(problems.some((p) => p.message.includes("isn't a valid key"))).toBe(
      true,
    );
  });

  it.each(["landlordName", "landlord_name", "_private", "party2"])(
    "accepts the valid key %p",
    (key) => {
      expect(validateFieldSchema([field({ key })])).toEqual([]);
    },
  );

  it("requires a label", () => {
    const problems = validateFieldSchema([field({ label: "   " })]);
    expect(problems.some((p) => p.message.includes("label is required"))).toBe(
      true,
    );
  });

  it("requires a select to carry options", () => {
    const problems = validateFieldSchema([field({ type: "select" })]);
    expect(
      problems.some((p) => p.message.includes("at least one option")),
    ).toBe(true);
  });

  it("requires every select option to have both value and label", () => {
    const problems = validateFieldSchema([
      field({ type: "select", options: [{ value: "yes", label: "" }] }),
    ]);
    expect(
      problems.some((p) => p.message.includes("both a value and a label")),
    ).toBe(true);
  });
});

describe("updateField", () => {
  it("drops options when the type moves away from select, so stale data can't reach the API", () => {
    const schema = [
      field({ type: "select", options: [{ value: "a", label: "A" }] }),
    ];
    const next = updateField(schema, 0, { type: "text" });
    expect(next[0]?.options).toBeUndefined();
  });

  it("seeds an empty options list when the type becomes select", () => {
    const next = updateField([field()], 0, { type: "select" });
    expect(next[0]?.options).toEqual([]);
  });

  it("leaves other fields untouched", () => {
    const schema = [field(), field({ key: "tenantName" })];
    const next = updateField(schema, 0, { label: "Changed" });
    expect(next[1]).toBe(schema[1]);
  });
});

describe("moveField", () => {
  const schema = [
    field({ key: "a" }),
    field({ key: "b" }),
    field({ key: "c" }),
  ];

  it("reorders, since field order is the order customers fill them in", () => {
    expect(moveField(schema, 2, 0).map((f) => f.key)).toEqual(["c", "a", "b"]);
  });

  it("returns the schema unchanged when the target is out of bounds", () => {
    expect(moveField(schema, 0, -1)).toBe(schema);
    expect(moveField(schema, 2, 3)).toBe(schema);
  });
});

describe("rupee/paise conversion", () => {
  it.each([
    ["199", 19900],
    ["0", 0],
    ["1999.99", 199999],
    ["  250  ", 25000],
  ])("converts %p rupees to %p paise", (input, expected) => {
    expect(rupeesToPaise(input)).toBe(expected);
  });

  // Money is stored as an integer so float drift can never reach the DB;
  // 19.99 * 100 is 1998.9999... in IEEE 754 without the rounding.
  it("rounds rather than truncating fractional paise", () => {
    expect(rupeesToPaise("19.99")).toBe(1999);
  });

  it.each(["", "   ", "abc", "-5"])("rejects %p", (input) => {
    expect(rupeesToPaise(input)).toBeNull();
  });

  it("round-trips through paiseToRupees", () => {
    expect(rupeesToPaise(paiseToRupees(19900))).toBe(19900);
  });
});
