import Link from "next/link";

import { COURSES_LIVE } from "../lib/features";
import { LEGAL_PAGES, LIBRARY_SHELVES, shelfHref } from "../lib/navigation";

import { SiteLogo } from "./SiteLogo";

const COLUMNS: { heading: string; links: { href: string; label: string }[] }[] =
  [
    {
      heading: "Documents",
      links: [
        { href: "/documents", label: "Document generator" },
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
      ],
    },
    {
      heading: "Help",
      links: [
        { href: "/assistant", label: "Ask the AI assistant" },
        { href: "/verify", label: "Verify a certificate" },
        { href: "/contact", label: "Contact us" },
        { href: "/dashboard", label: "My account" },
      ],
    },
  ];

/**
 * Server component — no interactivity, and the legal note here is exactly
 * the sort of thing that should be in the initial HTML.
 *
 * Navy, closing every page the way the hero opens the home page: the light
 * header and the dark footer frame the page, and the band says "this is the
 * end" without a rule having to.
 */
export function SiteFooter() {
  return (
    <footer className="mt-24 bg-surface-inverse">
      <div className="mx-auto max-w-shell px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="max-w-xs">
            <SiteLogo tone="dark" />
            <p className="mt-4 text-sm leading-relaxed text-ink-inverse-muted">
              Legal documents, forms and guides for individuals and small
              businesses in India — written for people who aren&apos;t lawyers.
            </p>
            <p className="mt-4 text-sm font-semibold text-brand">
              Har Ghar Mein Kanooni Gyaan
            </p>
          </div>

          {COLUMNS.map((column) => (
            <nav key={column.heading} aria-label={column.heading}>
              <h2 className="font-sans text-sm font-semibold tracking-normal text-ink-inverse">
                {column.heading}
              </h2>
              <ul className="mt-4 space-y-3 text-sm">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-ink-inverse-muted transition-colors hover:text-ink-inverse"
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
        <div className="mt-12 flex flex-col gap-3 border-t border-line-inverse pt-6 text-xs leading-relaxed text-ink-inverse-muted sm:flex-row sm:justify-between sm:gap-8">
          <p className="max-w-prose">
            Pratikar Digital Hub provides document templates and educational
            material. It is not a law firm and does not provide legal advice.
            Using this service does not create a solicitor–client relationship.
          </p>
          <div className="shrink-0 space-y-3 sm:text-right">
            <nav aria-label="Legal">
              <ul className="flex flex-wrap gap-x-4 gap-y-1 sm:justify-end">
                {LEGAL_PAGES.map((page) => (
                  <li key={page.href}>
                    <Link
                      href={page.href}
                      className="text-ink-inverse-muted transition-colors hover:text-ink-inverse"
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
