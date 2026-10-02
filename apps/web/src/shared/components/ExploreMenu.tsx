"use client";

import { CONTENT_CATEGORIES } from "@pratikar/types";
import {
  BadgeCheck,
  BookOpen,
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
    hint: "Video courses with a certificate",
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

/**
 * The header's "Explore" menu — what Coursera and Udemy put beside the logo:
 * the whole catalogue one click away, by kind on the left and by topic on
 * the right, without a header row of a dozen links.
 */
export function ExploreMenu() {
  const { isOpen, setIsOpen, containerRef } = useDismissable<HTMLDivElement>();
  const close = () => setIsOpen(false);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        data-menu-trigger
        aria-expanded={isOpen}
        aria-controls="explore-menu"
        onClick={() => setIsOpen((open) => !open)}
        className={`inline-flex h-10 items-center gap-1.5 rounded-control px-3 text-sm font-semibold transition-colors ${
          isOpen
            ? "bg-primary-subtle text-primary"
            : "text-ink hover:bg-surface-sunken"
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
          className="absolute left-0 top-full z-50 mt-2 grid w-[40rem] grid-cols-[1.4fr_1fr] overflow-hidden rounded-card border border-line bg-surface shadow-overlay"
        >
          <div className="p-3">
            <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-wider text-ink-subtle">
              What we offer
            </p>
            <ul>
              {OFFERINGS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={close}
                    className="flex items-start gap-3 rounded-control px-3 py-2.5 transition-colors hover:bg-surface-sunken"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-control bg-primary-subtle text-primary">
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
          <div className="border-l border-line bg-surface-sunken p-3">
            <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-wider text-ink-subtle">
              Browse by topic
            </p>
            <ul>
              {TOPICS.map((topic) => (
                <li key={topic.href}>
                  <Link
                    href={topic.href}
                    onClick={close}
                    className="block rounded-control px-3 py-2 text-sm text-ink transition-colors hover:bg-surface"
                  >
                    {topic.label}
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href="/content-library"
              onClick={close}
              className="mt-2 block rounded-control px-3 py-2 text-sm font-semibold text-primary hover:bg-surface"
            >
              The whole library →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
