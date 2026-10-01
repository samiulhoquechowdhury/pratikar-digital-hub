import type { ContentType } from "@pratikar/types";

/**
 * One description of the site's shape, shared by the header, the mobile
 * drawer, the footer and the home page. Adding a section in one place and
 * forgetting the others is how navigation quietly goes stale.
 */

export interface NavLink {
  href: string;
  label: string;
  /** One line, used wherever there's room to say what a section actually is. */
  hint: string;
}

/**
 * The whole top-level navigation. Four entries on purpose: the catalogue is
 * three kinds of thing plus the one public tool, and a header with more than
 * that stops being scannable at a glance.
 */
export const PRIMARY_NAV: NavLink[] = [
  {
    href: "/documents",
    label: "Documents",
    hint: "Answer a few questions, get a ready-to-sign document",
  },
  {
    href: "/courses",
    label: "Courses",
    hint: "Video courses with a verifiable certificate",
  },
  {
    href: "/content-library",
    label: "Library",
    hint: "E-books, checklists and forms to download",
  },
  {
    href: "/verify",
    label: "Verify",
    hint: "Check a certificate code — no account needed",
  },
];

/**
 * The library's three shelves, in the order the tabs show them. `type` is
 * the ContentType the API filters on; `slug` is what goes in the URL, so a
 * shelf is a link someone can share.
 */
export const LIBRARY_SHELVES: {
  type: ContentType;
  slug: string;
  label: string;
  hint: string;
}[] = [
  {
    type: "EBOOK",
    slug: "ebooks",
    label: "E-books",
    hint: "Long-form guides, written for people who aren't lawyers",
  },
  {
    type: "CHECKLIST",
    slug: "checklists",
    label: "Checklists",
    hint: "What to check before you sign, file or register",
  },
  {
    type: "FORM",
    slug: "forms",
    label: "Forms",
    hint: "Affidavits, notices and applications to fill in yourself",
  },
];

/** Where a library item of this type lives, for links from anywhere else. */
export const shelfHref = (type: ContentType) => {
  const shelf = LIBRARY_SHELVES.find((s) => s.type === type);
  return shelf ? `/content-library?shelf=${shelf.slug}` : "/content-library";
};

/**
 * The legal and contact pages, in the order the footer and each page's own
 * "other policies" list show them. Razorpay's activation review looks for
 * all five, linked from every page.
 */
export const LEGAL_PAGES = [
  { href: "/terms", label: "Terms of Use" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/refunds", label: "Cancellation & Refunds" },
  { href: "/delivery", label: "Delivery Policy" },
  { href: "/contact", label: "Contact" },
] as const;
