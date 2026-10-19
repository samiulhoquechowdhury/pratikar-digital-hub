import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { categoryHref } from "../lib/navigation";

import { Icon } from "./Icon";

/** Who the site is for — Coursera's audience row, as links into the catalogue. */
const AUDIENCES = [
  { href: "/documents", label: "For individuals" },
  { href: categoryHref("BUSINESS_COMPLIANCE"), label: "For businesses" },
  { href: categoryHref("LEGAL_PRACTICE"), label: "For advocates & students" },
];

/**
 * The slim strip above the header, as Coursera keeps one: who the site is
 * for on the left, the one piece of news on the right. Navy, so it reads as
 * part of the frame rather than the page.
 *
 * Not sticky: it scrolls away, so the sticky header below stays the only
 * thing pinned to the top of the screen.
 */
export function AnnouncementBar() {
  return (
    <div data-surface="inverse" className="bg-noir text-white">
      <div className="mx-auto flex h-9 max-w-shell items-center justify-between gap-6 px-4 text-[0.8125rem] sm:px-6 lg:px-8">
        <nav aria-label="Audiences" className="hidden md:block">
          <ul className="flex items-center">
            {AUDIENCES.map((link, index) => (
              <li key={link.href} className="flex items-center">
                {index > 0 && (
                  <span aria-hidden className="mx-3 h-3.5 w-px bg-white/25" />
                )}
                <Link
                  href={link.href}
                  className="text-white/80 transition-colors hover:text-white"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <Link
          href="/documents/custom"
          className="group flex min-w-0 items-center gap-2 text-white/90 hover:text-white md:ml-auto"
        >
          <span className="shrink-0 rounded bg-brand px-1.5 py-0.5 text-[0.6875rem] font-bold text-on-brand">
            NEW
          </span>
          <span className="truncate">
            AI drafting, reviewed by a practising advocate
          </span>
          <Icon
            icon={ArrowRight}
            size="xs"
            className="shrink-0 transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none"
          />
        </Link>
      </div>
    </div>
  );
}
