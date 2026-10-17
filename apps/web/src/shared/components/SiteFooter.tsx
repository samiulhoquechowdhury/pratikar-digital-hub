import { CONTENT_CATEGORIES } from "@pratikar/types";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { COURSES_LIVE } from "../lib/features";
import { CONTENT_CATEGORY_LABELS } from "../lib/labels";
import {
  categoryHref,
  LEGAL_PAGES,
  LIBRARY_SHELVES,
  shelfHref,
} from "../lib/navigation";

import { Icon } from "./Icon";
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
        { href: "/assistant", label: "AI assistant" },
        { href: "/contact", label: "Contact us" },
        { href: "/dashboard", label: "My account" },
      ],
    },
  ];

/**
 * Server component — no interactivity, and the legal note here is exactly
 * the sort of thing that should be in the initial HTML.
 *
 * Noir, closing every page the way a fine document closes: a last line in
 * the display serif, the site's index set in columns between hairlines, and
 * the wordmark engraved across the foot.
 */
export function SiteFooter() {
  return (
    <footer
      data-surface="inverse"
      className="relative mt-28 overflow-hidden bg-noir text-ivory"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gold-foil opacity-60"
      />

      {/* Extra room at the bottom on phones, so the floating Ask AI button
          never sits on the footer's last line. */}
      <div className="relative mx-auto max-w-shell px-4 pb-24 pt-20 sm:px-6 sm:pb-10 lg:px-8">
        <div
          data-footer-cta
          className="grid gap-10 border-b border-noir-line pb-16 lg:grid-cols-[1.4fr_1fr] lg:items-end"
        >
          <h2 className="text-4xl font-light leading-[1.05] text-ivory sm:text-6xl">
            Legal help for every home,{" "}
            <span className="accent-serif text-brand">in plain words.</span>
          </h2>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Link href="/documents" className="btn-gold">
              Find a document
            </Link>
            <Link href="/assistant" className="btn-line-inverse">
              Ask the AI
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-12 pt-14 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div className="col-span-2 max-w-xs lg:col-span-1">
            <SiteLogo tone="dark" />
            <p className="mt-6 text-sm leading-relaxed text-ivory/60">
              Legal documents, forms and guides for individuals and small
              businesses in India — written for people who aren&apos;t lawyers.
            </p>
            <p className="mt-6 font-display text-lg italic text-brand">
              Har Ghar Mein Kanooni Gyaan
            </p>
          </div>

          {COLUMNS.map((column) => (
            <nav key={column.heading} aria-label={column.heading}>
              <h2 className="font-sans text-[0.65rem] font-semibold uppercase tracking-[0.26em] text-ivory/45">
                {column.heading}
              </h2>
              <ul className="mt-5 space-y-3 text-sm">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="link-draw text-ivory/75 transition-colors hover:text-ivory"
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
        <div className="mt-16 flex flex-col gap-4 border-t border-noir-line pt-8 text-xs leading-relaxed text-ivory/50 sm:flex-row sm:justify-between sm:gap-10">
          <p className="max-w-prose">
            Pratikar Digital Hub provides document templates and educational
            material. It is not a law firm and does not provide legal advice.
            Using this service does not create a solicitor–client relationship.
          </p>
          <div className="shrink-0 space-y-3 sm:text-right">
            <nav aria-label="Legal">
              <ul className="flex flex-wrap gap-x-5 gap-y-1 sm:justify-end">
                {LEGAL_PAGES.map((page) => (
                  <li key={page.href}>
                    <Link
                      href={page.href}
                      className="transition-colors hover:text-ivory"
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

        <div className="mt-12 flex items-end justify-between gap-6">
          <p
            aria-hidden
            className="pointer-events-none select-none whitespace-nowrap font-brand text-[13vw] font-semibold leading-[0.8] tracking-[0.02em] text-white/[0.045] lg:text-[9rem]"
          >
            PRATIKAR
          </p>
          <Link
            href="#main"
            className="mb-2 hidden shrink-0 items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-ivory/50 transition-colors hover:text-ivory sm:inline-flex"
          >
            Back to top
            <Icon icon={ArrowUpRight} size="xs" className="-rotate-45" />
          </Link>
        </div>
      </div>
    </footer>
  );
}
