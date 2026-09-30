import {
  contentHash,
  describeContentItem,
  describeCourse,
  describeTemplate,
} from "./sources";

describe("describeTemplate", () => {
  it("names the document, what the service is, and what the form asks for", () => {
    const text = describeTemplate({
      title: "Rent Agreement",
      category: "property",
      fieldSchema: [
        { key: "landlord", label: "Landlord's name", type: "text" },
        { key: "rent", label: "Monthly rent", type: "number" },
      ],
    });

    expect(text).toContain("Rent Agreement");
    expect(text).toContain("generated for them");
    expect(text).toContain("Category: Property.");
    expect(text).toContain("The form asks for: Landlord's name, Monthly rent.");
  });

  // fieldSchema is a Json column; one bad entry should cost one label.
  it("skips malformed fields instead of failing the template", () => {
    const text = describeTemplate({
      title: "T",
      category: "c",
      fieldSchema: [null, "x", { key: "k" }, { label: "  Date  " }],
    });

    expect(text).toContain("The form asks for: Date.");
  });

  it("omits the field line when there are no fields", () => {
    const text = describeTemplate({
      title: "T",
      category: "c",
      fieldSchema: {},
    });

    expect(text).not.toContain("asks for");
  });

  it("never mentions a price", () => {
    const text = describeTemplate({
      title: "T",
      category: "c",
      fieldSchema: [],
    });

    expect(text).not.toMatch(/₹|price|paise/i);
  });
});

describe("describeCourse", () => {
  it("lists lessons in playback order, not storage order", () => {
    const text = describeCourse({
      title: "GST Basics",
      description: "Filing returns without an accountant.",
      accessDurationDays: 180,
      modules: [
        { title: "Filing GSTR-1", order: 2 },
        { title: "What GST is", order: 1 },
      ],
    });

    expect(text).toContain("of 2 lessons, available for 180 days");
    expect(text).toContain("Filing returns without an accountant.");
    expect(text).toContain("Lessons: 1. What GST is; 2. Filing GSTR-1.");
  });

  it("copes with a course that has no description or lessons yet", () => {
    const text = describeCourse({
      title: "New",
      description: null,
      accessDurationDays: 90,
      modules: [],
    });

    expect(text).toBe(
      "New\nAn online video course, available for 90 days after enrolment.",
    );
  });
});

describe("describeContentItem", () => {
  // The FORM/template distinction is one a customer needs spelled out.
  it("says a form is completed by the customer, not generated", () => {
    const text = describeContentItem({
      title: "General Affidavit",
      category: "LEGAL_PRACTICE",
      type: "FORM",
    });

    expect(text).toContain("completed by the customer themselves");
    expect(text).toContain("Content library section: Legal practice.");
  });
});

describe("contentHash", () => {
  it("changes with the model, so switching models re-embeds everything", () => {
    expect(contentHash("voyage-4", "x")).not.toBe(
      contentHash("voyage-4-lite", "x"),
    );
  });

  it("is stable for the same input", () => {
    expect(contentHash("m", "x")).toBe(contentHash("m", "x"));
  });
});
