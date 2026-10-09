import type {
  ContentLibraryItem,
  ContentType,
  Course,
  Template,
} from "@pratikar/types";
import { grossPaise } from "@pratikar/utils";
import type { Metadata } from "next";

import { CONTENT_CATEGORY_LABELS, templateCategoryLabel } from "./labels";
import { SITE_NAME, absoluteUrl } from "./site";

/**
 * What search results and share previews say about each product.
 *
 * The catalogue has no description column yet, so these are built from what
 * each item does have — its kind, category, question count, access period —
 * rather than left to a search engine to scrape out of the page chrome.
 * Kept under ~160 characters, the length a search result shows in full.
 */

const LIBRARY_KIND: Record<ContentType, string> = {
  EBOOK: "E-book",
  CHECKLIST: "Checklist",
  FORM: "Fill-in form",
};

export const templateDescription = (template: Template): string => {
  const questions = template.fieldSchema.length;
  return `Create a ready-to-sign ${template.title} online. Answer ${questions} plain-language ${
    questions === 1 ? "question" : "questions"
  } and download it as Word and PDF. ${templateCategoryLabel(template.category)}.`;
};

export const courseDescription = (course: Course): string =>
  course.description?.trim()
    ? `${course.description.trim()} Video course with a verifiable certificate.`
    : `${course.title}: a video course with ${course.accessDurationDays} days' access and a certificate anyone can verify.`;

export const libraryDescription = (item: ContentLibraryItem): string =>
  `${LIBRARY_KIND[item.type]}: ${item.title}. ${
    CONTENT_CATEGORY_LABELS[item.category]
  }. Buy once and download from your account.`;

/** Prices in structured data are the amount charged: GST included. */
const offer = (priceInPaise: number, path: string) => ({
  "@type": "Offer",
  price: (grossPaise(priceInPaise) / 100).toFixed(2),
  priceCurrency: "INR",
  availability: "https://schema.org/InStock",
  url: absoluteUrl(path),
});

const brand = { "@type": "Organization", name: SITE_NAME };

/** schema.org markup, so search engines read type and price directly. */
export const templateJsonLd = (template: Template) => ({
  "@context": "https://schema.org",
  "@type": "Product",
  name: template.title,
  description: templateDescription(template),
  category: templateCategoryLabel(template.category),
  brand,
  offers: offer(template.priceInPaise, `/documents/${template.id}`),
});

export const courseJsonLd = (course: Course) => ({
  "@context": "https://schema.org",
  "@type": "Course",
  name: course.title,
  description: courseDescription(course),
  provider: { ...brand, sameAs: absoluteUrl("/") },
  offers: {
    ...offer(course.priceInPaise, `/courses/${course.id}`),
    category: "Paid",
  },
});

export const libraryJsonLd = (item: ContentLibraryItem) => ({
  "@context": "https://schema.org",
  "@type": "Product",
  name: item.title,
  description: libraryDescription(item),
  category: CONTENT_CATEGORY_LABELS[item.category],
  brand,
  offers: offer(item.priceInPaise, `/content-library/${item.id}`),
});

/**
 * JSON for a <script> tag. "<" is escaped so a title containing "</script>"
 * can't close the tag early and inject markup — product titles are typed by
 * staff, and staff input is still input.
 */
export const serializeJsonLd = (data: object): string =>
  JSON.stringify(data).replace(/</g, "\\u003c");

/**
 * A product page's metadata, complete.
 *
 * Complete because Next merges metadata one key deep: a page that sets
 * `openGraph` replaces the layout's whole `openGraph`, site name and locale
 * included. Building every product page's from here keeps them all.
 */
export const productMetadata = ({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata => ({
  title,
  description,
  alternates: { canonical: path },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_IN",
    title,
    description,
    url: path,
  },
  twitter: { card: "summary_large_image", title, description },
});
