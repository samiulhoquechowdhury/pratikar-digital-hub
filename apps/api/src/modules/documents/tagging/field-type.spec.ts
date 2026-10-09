import type { Blank } from "./blanks";
import { guessFieldType, labelFor } from "./field-type";

const blank = (before: string, width = 12): Blank => ({
  index: 0,
  width,
  before,
  after: "",
});

describe("guessFieldType", () => {
  it.each([
    ["Signed on this day of", "date"],
    ["Agreement dated", "date"],
    ["a monthly rent of Rs.", "number"],
    ["aged about", "number"],
    ["FIR/Case No.", "number"],
  ] as const)("reads %j as %s", (before, expected) => {
    expect(guessFieldType(blank(before))).toBe(expected);
  });

  it("treats a full-line rule as free text", () => {
    // The document is offering several lines, not asking for a name.
    expect(guessFieldType(blank("Details of the arrangement:", 120))).toBe(
      "textarea",
    );
  });

  it("falls back to text", () => {
    expect(guessFieldType(blank("I, Mr./Ms."))).toBe("text");
  });
});

describe("labelFor", () => {
  it("turns a camelCase key into something readable", () => {
    expect(labelFor("daughterWifeOf")).toBe("Daughter wife of");
    expect(labelFor("monthlyRentInRupees")).toBe("Monthly rent in rupees");
  });
});
