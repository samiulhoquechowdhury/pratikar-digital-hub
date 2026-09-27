import Link from "next/link";

import { LIBRARY_SHELVES } from "../lib/navigation";

import { SiteLogo } from "./SiteLogo";

const COLUMNS: { heading: string; links: { href: string; label: string }[] }[] =
  [
    {
      heading: "Documents",
      links: [
        { href: "/documents", label: "All templates" },
        { href: "/dashboard#documents", label: "My documents" },
      ],
    },
    {
      heading: "Learn",
      links: [
        { href: "/courses", label: "Courses" },
        ...LIBRARY_SHELVES.map((shelf) => ({
          href: `/content-library?shelf=${shelf.slug}`,
          label: shelf.label,
        })),
      ],
    },
    {
      heading: "Help",
      links: [
        { href: "/verify", label: "Verify a certificate" },
        { href: "/assistant", label: "Ask AI" },
        { href: "/dashboard", label: "My account" },
      ],
    },
  ];

/**
 * Server component — no interactivity, and the legal note here is exactly
 * the sort of thing that should be in the initial HTML.
 *
 * Light, like the header: a hairline and a sunken tone mark the end of the
 * page without the heavy band of colour a dark footer puts under every
 * screen.
 */
export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line bg-surface">
      <div className="mx-auto max-w-shell px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="max-w-xs">
            <SiteLogo />
            <p className="mt-4 text-sm leading-relaxed text-ink-muted">
              Legal documents, courses and guides for individuals and small
              businesses in India — written for people who aren&apos;t lawyers.
            </p>
          </div>

          {COLUMNS.map((column) => (
            <nav key={column.heading} aria-label={column.heading}>
              <h2 className="font-sans text-sm font-semibold tracking-normal text-ink">
                {column.heading}
              </h2>
              <ul className="mt-4 space-y-3 text-sm">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-ink-muted transition-colors hover:text-ink"
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
        <div className="mt-12 flex flex-col gap-3 border-t border-line pt-6 text-xs leading-relaxed text-ink-subtle sm:flex-row sm:justify-between sm:gap-8">
          <p className="max-w-prose">
            Pratikar Digital Hub provides document templates and educational
            material. It is not a law firm and does not provide legal advice.
            Using this service does not create a solicitor–client relationship.
          </p>
          <p className="shrink-0">
            © {new Date().getFullYear()} Pratikar Digital Hub
          </p>
        </div>
      </div>
    </footer>
  );
}
