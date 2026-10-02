import type { ContentLibraryItem, Course, Template } from "@pratikar/types";

import { countLabel, summariseCatalogue } from "./catalogueSummary";

const item = (
  title: string,
  type: ContentLibraryItem["type"],
  category: ContentLibraryItem["category"],
) => ({ id: title, title, type, category }) as ContentLibraryItem;

describe("summariseCatalogue", () => {
  it("counts each kind from the rows actually on sale", () => {
    const summary = summariseCatalogue({
      templates: [{ title: "Rent Agreement" } as Template],
      courses: [{ title: "GST basics" } as Course],
      library: [
        item("Sale Deed", "FORM", "PROPERTY_DOCUMENTATION"),
        item("Gift Deed", "FORM", "PROPERTY_DOCUMENTATION"),
        item("Before you sign", "CHECKLIST", "CHECKLISTS_REFERENCE"),
      ],
    });

    expect(summary.templates.count).toBe(1);
    expect(summary.courses.count).toBe(1);
    expect(summary.library.FORM).toEqual({
      count: 2,
      examples: ["Sale Deed", "Gift Deed"],
    });
    expect(summary.library.EBOOK.count).toBe(0);
    expect(summary.total).toBe(5);
  });

  // A category tile that leads to an empty page is a dead end.
  it("leaves out categories with nothing in them", () => {
    const summary = summariseCatalogue({
      library: [item("Sale Deed", "FORM", "PROPERTY_DOCUMENTATION")],
    });

    expect(summary.categories.map((c) => c.category)).toEqual([
      "PROPERTY_DOCUMENTATION",
    ]);
  });

  it("treats a kind the API couldn't return as empty, not as an error", () => {
    expect(summariseCatalogue({}).total).toBe(0);
  });
});

describe("countLabel", () => {
  it.each([
    [0, "0"],
    [7, "7"],
    [19, "19"],
    [54, "50+"],
    [66, "60+"],
    [330, "300+"],
    [449, "400+"],
    [1234, "1200+"],
  ])("%i reads as %s — never more than there is", (count, label) => {
    expect(countLabel(count)).toBe(label);
  });
});
