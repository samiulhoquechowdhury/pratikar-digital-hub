"use client";

import Link from "next/link";

import { useDismissable } from "../hooks/useDismissable";
import { EXPLORE } from "../lib/navigation";

/**
 * The "Explore" panel, in the shape Coursera and Udemy settled on: one button
 * that opens the whole catalogue at once, grouped by intent.
 *
 * Opens on click rather than hover. A hover menu this size is a well-known
 * accessibility problem — it opens when you're only passing through, and it's
 * unusable with a touchscreen or a keyboard.
 */
export function ExploreMenu() {
  const { isOpen, setIsOpen, containerRef } = useDismissable<HTMLDivElement>();

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        data-menu-trigger
        aria-expanded={isOpen}
        aria-haspopup="true"
        onClick={() => setIsOpen((open) => !open)}
        className="flex items-center gap-1.5 rounded-control px-3 py-2 text-sm font-medium text-ink-inverse-muted transition-colors hover:bg-surface-inverse-raised hover:text-ink-inverse"
      >
        Explore
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className={`h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <div
          // Light panel against navy chrome: it's a reading surface with four
          // columns of descriptions, and those are easier on white.
          className="absolute left-0 top-full z-50 mt-2 w-[min(56rem,calc(100vw-2rem))] rounded-card border border-line bg-surface p-6 shadow-overlay"
        >
          <div className="grid gap-8 sm:grid-cols-3">
            {EXPLORE.map((group) => (
              <div key={group.label}>
                <Link
                  href={group.href}
                  onClick={() => setIsOpen(false)}
                  className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-ink hover:underline"
                >
                  {group.label}
                </Link>
                <ul className="mt-3 space-y-1">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        onClick={() => setIsOpen(false)}
                        className="block rounded-control px-2 py-1.5 transition-colors hover:bg-surface-sunken"
                      >
                        <span className="block text-sm font-medium text-ink">
                          {link.label}
                        </span>
                        <span className="mt-0.5 block text-xs text-ink-muted">
                          {link.hint}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
