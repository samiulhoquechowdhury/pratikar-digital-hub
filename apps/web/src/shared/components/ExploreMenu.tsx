"use client";

import { CONTENT_CATEGORIES } from "@pratikar/types";
import {
  BadgeCheck,
  BookOpen,
  ArrowRight,
  ChevronDown,
  FileSignature,
  FileText,
  GraduationCap,
  ListChecks,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

import { useDismissable } from "../hooks/useDismissable";
import { COURSES_LIVE } from "../lib/features";
import { CONTENT_CATEGORY_LABELS } from "../lib/labels";
import { categoryHref, shelfHref } from "../lib/navigation";

import { Icon } from "./Icon";

/** Everything the site offers, as the Explore menu and mobile drawer list it. */
export const OFFERINGS: {
  href: string;
  label: string;
  hint: string;
  icon: LucideIcon;
}[] = [
  {
    href: "/documents",
    label: "Document generator",
    hint: "A finished document from a few answers",
    icon: FileText,
  },
  {
    href: shelfHref("FORM"),
    label: "Legal forms",
    hint: "Agreements, affidavits, notices",
    icon: FileSignature,
  },
  {
    href: shelfHref("CHECKLIST"),
    label: "Checklists",
    hint: "What to check before you sign or file",
    icon: ListChecks,
  },
  {
    href: shelfHref("EBOOK"),
    label: "E-books",
    hint: "Plain-language legal handbooks",
    icon: BookOpen,
  },
  {
    href: "/courses",
    label: "Courses",
    hint: COURSES_LIVE
      ? "Video courses with a certificate"
      : "Coming soon — video courses with a certificate",
    icon: GraduationCap,
  },
  {
    href: "/assistant",
    label: "AI assistant",
    hint: "Not sure what you need? Ask",
    icon: Sparkles,
  },
  {
    href: "/verify",
    label: "Verify a certificate",
    hint: "Check a code — no account needed",
    icon: BadgeCheck,
  },
];

/** The library's topics, as links into the filtered library. */
export const TOPICS = CONTENT_CATEGORIES.map((category) => ({
  href: categoryHref(category),
  label: CONTENT_CATEGORY_LABELS[category],
}));

/** What people search for most — shown in the menu as ready-made searches. */
const POPULAR_SEARCHES = [
  "Rent agreement",
  "Affidavit",
  "Legal notice",
  "Partnership deed",
  "Power of attorney",
];

/**
 * The header's "Explore" mega-menu — what Coursera puts beside its logo: the
 * whole catalogue one click away. Three columns: by kind, by topic, and a
 * featured panel for AI drafting with the searches people run most.
 */
export function ExploreMenu() {
  const { isOpen, setIsOpen, containerRef } = useDismissable<HTMLDivElement>();
  const close = () => setIsOpen(false);

  return (
    // Not `relative`: the panel hangs from the header itself, full width.
    <div ref={containerRef}>
      <button
        type="button"
        data-menu-trigger
        aria-expanded={isOpen}
        aria-controls="explore-menu"
        onClick={() => setIsOpen((open) => !open)}
        className={`inline-flex items-center gap-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.2em] transition-colors ${
          isOpen ? "text-brand" : "text-ivory/75 hover:text-ivory"
        }`}
      >
        Explore
        <Icon
          icon={ChevronDown}
          size="xs"
          className={`transition-transform motion-reduce:transition-none ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div
          id="explore-menu"
          className="absolute inset-x-0 top-full z-50 border-b border-ivory-line bg-ivory text-ink shadow-float motion-safe:animate-fade-up"
        >
          <div className="mx-auto grid max-w-shell grid-cols-[1.25fr_1fr_1fr] px-8 py-6">
            <div className="p-4">
              <p className="eyebrow px-3 pb-3 pt-1">What we offer</p>
              <ul>
                {OFFERINGS.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={close}
                      className="group flex items-start gap-3 px-3 py-2.5 transition-colors hover:bg-ivory-deep"
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center bg-primary-subtle text-primary transition-colors group-hover:bg-primary group-hover:text-brand">
                        <Icon icon={item.icon} />
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-ink">
                          {item.label}
                        </span>
                        <span className="block text-xs text-ink-muted">
                          {item.hint}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-l border-line p-4">
              <p className="eyebrow px-3 pb-3 pt-1">Browse by topic</p>
              <ul>
                {TOPICS.map((topic) => (
                  <li key={topic.href}>
                    <Link
                      href={topic.href}
                      onClick={close}
                      className="block px-3 py-2 text-sm text-ink transition-colors hover:bg-ivory-deep"
                    >
                      {topic.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                href="/content-library"
                onClick={close}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-primary hover:bg-ivory-deep"
              >
                The whole library
                <Icon icon={ArrowRight} size="xs" />
              </Link>
            </div>

            <div className="flex flex-col gap-4 bg-ivory-deep p-5">
              <Link
                href="/documents/custom"
                onClick={close}
                data-surface="inverse"
                className="group relative overflow-hidden bg-noir-glow p-5 text-ink-inverse"
              >
                <span className="inline-flex items-center gap-1 bg-brand px-2 py-0.5 text-[0.6875rem] font-bold uppercase tracking-wider text-on-brand">
                  <Icon icon={Sparkles} size="xs" />
                  New
                </span>
                <span className="mt-3 block font-display text-lg font-bold leading-snug">
                  Can&apos;t find it? Have AI draft it.
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-ink-inverse-muted">
                  Reviewed by a practising advocate before you download.
                </span>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand">
                  Start drafting
                  <Icon
                    icon={ArrowRight}
                    size="xs"
                    className="transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none"
                  />
                </span>
              </Link>
              <div>
                <p className="eyebrow px-1 pb-2">Popular searches</p>
                <ul className="flex flex-wrap gap-1.5">
                  {POPULAR_SEARCHES.map((term) => (
                    <li key={term}>
                      <Link
                        href={`/search?q=${encodeURIComponent(term)}`}
                        onClick={close}
                        className="inline-block border border-line-strong bg-surface px-3 py-1 text-xs font-medium text-ink transition-colors hover:border-primary hover:text-primary"
                      >
                        {term}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
