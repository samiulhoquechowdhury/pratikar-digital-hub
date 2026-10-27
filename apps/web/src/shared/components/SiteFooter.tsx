import { CONTENT_CATEGORIES } from "@pratikar/types";
import Link from "next/link";

import { COURSES_LIVE } from "../lib/features";
import { CONTENT_CATEGORY_LABELS } from "../lib/labels";
import {
  categoryHref,
  LEGAL_PAGES,
  LIBRARY_SHELVES,
  shelfHref,
} from "../lib/navigation";

import { SiteLogo } from "./SiteLogo";

const COLUMNS: { heading: string; links: { href: string; label: string }[] }[] =
  [
    {
      heading: "Documents",
      links: [
        { href: "/documents", label: "Document generator" },
        { href: "/documents/custom", label: "AI drafting" },
        { href: shelfHref("FORM"), label: "Legal forms" },
        { href: "/dashboard/documents", label: "My documents" },
      ],
    },
    {
      heading: "Learn",
      links: [
        ...LIBRARY_SHELVES.filter((shelf) => shelf.type !== "FORM").map(
          (shelf) => ({
            href: `/content-library?shelf=${shelf.slug}`,
            label: shelf.label,
          }),
        ),
        {
          href: "/courses",
          label: COURSES_LIVE ? "Courses" : "Courses (coming soon)",
        },
        { href: "/verify", label: "Verify a certificate" },
      ],
    },
    {
      heading: "Areas of law",
      links: CONTENT_CATEGORIES.map((category) => ({
        href: categoryHref(category),
        label: CONTENT_CATEGORY_LABELS[category],
      })),
    },
    {
      heading: "Help",
      links: [
        { href: "/faq", label: "Questions" },
        { href: "/assistant", label: "Pratikar AI" },
        { href: "/contact", label: "Contact us" },
        { href: "/dashboard", label: "My account" },
      ],
    },
  ];

/**
 * Server component — no interactivity, and the legal note here is exactly
 * the sort of thing that should be in the initial HTML.
 *
 * Coursera's footer: light grey, the whole site map in plain columns, the
 * brand and the legal line underneath.
 */
export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-ivory-line bg-ivory">
      {/* Extra room at the bottom on phones, so the floating Pratikar AI button
          never sits on the footer's last line. */}
      <div className="mx-auto max-w-shell px-4 pb-24 pt-14 sm:px-6 sm:pb-10 lg:px-8">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div className="col-span-2 max-w-xs lg:col-span-1">
            <SiteLogo />
            <p className="mt-5 text-[0.9375rem] leading-relaxed text-noir/70">
              Legal documents, forms and guides for individuals and small
              businesses in India — written for people who aren&apos;t lawyers.
            </p>
            <p className="mt-4 font-semibold text-gold-ink">
              Har Ghar Mein Kanooni Gyaan
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/documents" className="btn-noir !px-4 !py-2 !text-sm">
                Find a document
              </Link>
              <Link href="/assistant" className="btn-line !px-4 !py-2 !text-sm">
                Pratikar AI
              </Link>
            </div>
          </div>

          {COLUMNS.map((column) => (
            <nav key={column.heading} aria-label={column.heading}>
              <h2 className="font-display text-base font-bold tracking-normal text-noir">
                {column.heading}
              </h2>
              <ul className="mt-4 space-y-2.5 text-[0.9375rem]">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-noir/70 transition-colors hover:text-noir hover:underline"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/*
          Not legal advice — this needs to be visible on a product that sells
          legal document templates, and belongs in the footer of every page
          rather than buried on one. Final wording is the client's lawyer's
          call, not ours.
        */}
        <div className="mt-12 flex flex-col gap-4 border-t border-ivory-line pt-6 text-sm leading-relaxed text-noir/60 sm:flex-row sm:justify-between sm:gap-10">
          <p className="max-w-prose">
            Pratikar Digital Hub provides document templates and educational
            material. It is not a law firm and does not provide legal advice.
            Using this service does not create a solicitor–client relationship.
          </p>
          <div className="shrink-0 space-y-2 sm:text-right">
            <nav aria-label="Legal">
              <ul className="flex flex-wrap gap-x-5 gap-y-1 sm:justify-end">
                {LEGAL_PAGES.map((page) => (
                  <li key={page.href}>
                    <Link
                      href={page.href}
                      className="transition-colors hover:text-noir hover:underline"
                    >
                      {page.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <p>© {new Date().getFullYear()} Pratikar Digital Hub</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
