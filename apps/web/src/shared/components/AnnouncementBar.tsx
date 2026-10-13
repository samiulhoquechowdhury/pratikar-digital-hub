import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Icon } from "./Icon";

const UTILITY = [
  { href: "/verify", label: "Verify a certificate" },
  { href: "/faq", label: "Help" },
  { href: "/contact", label: "Contact" },
];

/**
 * The slim navy strip above the header: one piece of news on the left, the
 * small utility links on the right — the way Jasper flags what's new and
 * Coursera keeps its secondary links out of the main bar.
 *
 * Not sticky: it scrolls away, so the sticky header below stays the only
 * thing pinned to the top of the screen.
 */
export function AnnouncementBar() {
  return (
    <div data-surface="inverse" className="bg-surface-inverse">
      <div className="mx-auto flex h-10 max-w-shell items-center justify-between gap-4 px-4 text-sm sm:px-6 lg:px-8">
        <Link
          href="/documents/custom"
          className="group flex min-w-0 items-center gap-2.5 text-ink-inverse"
        >
          <span className="shrink-0 rounded-full bg-brand px-2 py-0.5 text-[0.6875rem] font-bold uppercase tracking-wider text-on-brand">
            New
          </span>
          <span className="truncate">
            <span className="sm:hidden">AI drafting + advocate review</span>
            <span className="hidden sm:inline">
              Any document, drafted by AI and reviewed by a practising advocate
            </span>
          </span>
          <Icon
            icon={ArrowRight}
            size="xs"
            className="shrink-0 text-brand transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none"
          />
        </Link>
        <nav aria-label="Utility" className="hidden md:block">
          <ul className="flex items-center gap-5">
            {UTILITY.map((link) => (
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
      </div>
    </div>
  );
}
