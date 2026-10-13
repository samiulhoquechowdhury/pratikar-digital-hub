import { CONTENT_CATEGORIES } from "@pratikar/types";
import { ArrowRight, Sparkles } from "lucide-react";
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
      heading: "Topics",
      links: CONTENT_CATEGORIES.map((category) => ({
        href: categoryHref(category),
        label: CONTENT_CATEGORY_LABELS[category],
      })),
    },
    {
      heading: "Help",
      links: [
        { href: "/faq", label: "FAQ" },
        { href: "/assistant", label: "Ask the AI assistant" },
        { href: "/contact", label: "Contact us" },
        { href: "/dashboard", label: "My account" },
      ],
    },
  ];

/**
 * Server component — no interactivity, and the legal note here is exactly
 * the sort of thing that should be in the initial HTML.
 *
 * Navy, closing every page: a last invitation, the whole site map in
 * Coursera's columns, and the wordmark set huge and faint underneath — the
 * signature Jasper ends its pages on.
 */
export function SiteFooter() {
  return (
    <footer
      data-surface="inverse"
      className="relative mt-24 overflow-hidden bg-surface-inverse"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-[radial-gradient(closest-side,rgb(212_175_55/0.12),transparent)]"
      />

      {/* Extra room at the bottom on phones, so the floating Ask AI button
          never sits on the footer's last line. */}
      <div className="relative mx-auto max-w-shell px-4 pb-24 pt-16 sm:px-6 sm:pb-10 lg:px-8">
        <div className="flex flex-col gap-8 border-b border-line-inverse pb-12 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <p className="text-sm font-semibold text-brand">
              Har Ghar Mein Kanooni Gyaan
            </p>
            <h2 className="mt-3 text-3xl font-bold leading-tight text-ink-inverse sm:text-4xl">
              Legal help for every home —{" "}
              <span className="accent-serif text-brand">in plain words.</span>
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/documents"
              className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-on-brand transition-colors hover:bg-brand-hover"
            >
              Find a document
              <Icon icon={ArrowRight} size="xs" />
            </Link>
            <Link
              href="/assistant"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-ink-inverse transition-colors hover:bg-white/10"
            >
              <Icon icon={Sparkles} size="xs" className="text-brand" />
              Ask the AI
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-10 pt-12 lg:grid-cols-[1.3fr_repeat(4,1fr)]">
          <div className="col-span-2 max-w-xs lg:col-span-1">
            <SiteLogo tone="dark" />
            <p className="mt-5 text-sm leading-relaxed text-ink-inverse-muted">
              Legal documents, forms and guides for individuals and small
              businesses in India — written for people who aren&apos;t lawyers.
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
        <div className="mt-14 flex flex-col gap-3 border-t border-line-inverse pt-6 text-xs leading-relaxed text-ink-inverse-muted sm:flex-row sm:justify-between sm:gap-8">
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

        <p
          aria-hidden
          className="pointer-events-none mt-10 select-none whitespace-nowrap text-center font-brand text-[14vw] font-semibold leading-none tracking-[0.04em] text-white/[0.05] lg:text-[11rem]"
        >
          PRATIKAR
        </p>
      </div>
    </footer>
  );
}
