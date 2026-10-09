import type { ContentLibraryItem, Course, Template } from "@pratikar/types";

import {
  courseDescription,
  courseJsonLd,
  libraryDescription,
  productMetadata,
  serializeJsonLd,
  templateDescription,
  templateJsonLd,
} from "./seo";

const template: Template = {
  id: "t1",
  title: "Rent Agreement",
  category: "agreement",
  priceInPaise: 19900,
  reviewPriceInPaise: 99900,
  fieldSchema: [
    { key: "a", label: "A", type: "text", required: true },
    { key: "b", label: "B", type: "text", required: true },
  ],
  status: "PUBLISHED",
  createdAt: "2026-09-01T00:00:00.000Z",
};

describe("descriptions", () => {
  it("says what a template gets you, with its question count", () => {
    expect(templateDescription(template)).toBe(
      "Create a ready-to-sign Rent Agreement online. Answer 2 plain-language questions and download it as Word and PDF. Agreement.",
    );
  });

  it("falls back to access period for a course with no description", () => {
    const course = {
      id: "c1",
      title: "GST Basics",
      description: null,
      priceInPaise: 100,
      accessDurationDays: 180,
    } as unknown as Course;

    expect(courseDescription(course)).toContain("180 days' access");
  });

  it("names a library item's kind and category", () => {
    const item = {
      id: "i1",
      title: "GST Checklist",
      type: "CHECKLIST",
      category: "BUSINESS_COMPLIANCE",
      priceInPaise: 100,
    } as ContentLibraryItem;

    expect(libraryDescription(item)).toMatch(
      /^Checklist: GST Checklist\. Business & compliance\./,
    );
  });
});

describe("structured data", () => {
  // Search results show this number; it must be what checkout charges.
  it("prices a product GST-inclusive, in rupees", () => {
    expect(templateJsonLd(template).offers).toMatchObject({
      price: "234.82",
      priceCurrency: "INR",
    });
  });

  it("marks a course as a Course, not a Product", () => {
    const course = {
      id: "c1",
      title: "GST Basics",
      description: "Filing.",
      priceInPaise: 100,
      accessDurationDays: 180,
    } as unknown as Course;

    expect(courseJsonLd(course)["@type"]).toBe("Course");
  });

  // Titles are typed by staff; one containing "</script>" must not be able
  // to end the tag and inject markup into every product page.
  it("escapes < so a title can't close the script tag", () => {
    const json = serializeJsonLd({ name: "</script><img src=x onerror=1>" });

    expect(json).not.toContain("<");
    expect(JSON.parse(json)).toEqual({
      name: "</script><img src=x onerror=1>",
    });
  });
});

describe("productMetadata", () => {
  // A page's openGraph replaces the layout's whole block in Next's merge.
  it("carries the site name and locale, not just the page's own fields", () => {
    const meta = productMetadata({
      title: "Rent Agreement",
      description: "d",
      path: "/documents/t1",
    });

    expect(meta.alternates).toEqual({ canonical: "/documents/t1" });
    expect(meta.openGraph).toMatchObject({
      siteName: "Pratikar Digital Hub",
      locale: "en_IN",
      url: "/documents/t1",
    });
  });
});
