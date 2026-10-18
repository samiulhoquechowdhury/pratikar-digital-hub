import {
  ArrowRight,
  BookOpen,
  FileSignature,
  FileText,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { HeroSearch } from "@/features/home";
import { Icon } from "@/shared/components/Icon";
import { shelfHref } from "@/shared/lib/navigation";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false },
};

const WAYS_ON: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/documents", label: "Create a document", icon: FileText },
  { href: shelfHref("FORM"), label: "Legal forms", icon: FileSignature },
  { href: shelfHref("EBOOK"), label: "E-books", icon: BookOpen },
  { href: "/assistant", label: "Ask the AI assistant", icon: Sparkles },
];

/**
 * Every unknown address, and every product that's been unpublished. Most
 * people land here from an old link to something that has moved or gone, so
 * the page's job is to get them to what they were after — a search box
 * first, then the main ways in — not to apologise at length.
 */
export default function NotFound() {
  return (
    <section className="relative isolate overflow-hidden bg-ivory">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,theme(colors.navy.100/55%)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.navy.100/55%)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_60%_70%_at_20%_0%,black,transparent_80%)]"
      />
      <div className="mx-auto max-w-shell px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="max-w-2xl">
          <p className="font-display text-8xl font-bold text-gold-ink sm:text-9xl">
            404
          </p>
          <h1 className="mt-4 text-4xl sm:text-5xl">
            We couldn&apos;t find that page
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-ink-muted">
            The link may be old, or the item may no longer be available. Search
            for what you need, or start from one of these.
          </p>
          <div className="mt-8">
            <HeroSearch />
          </div>
        </div>

        <ul className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {WAYS_ON.map((way) => (
            <li key={way.href}>
              <Link
                href={way.href}
                className="group flex items-center gap-3 border border-ivory-line bg-surface p-5 transition-colors hover:border-noir"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-noir text-brand">
                  <Icon icon={way.icon} size="md" />
                </span>
                <span className="flex-1 text-sm font-semibold text-ink">
                  {way.label}
                </span>
                <Icon
                  icon={ArrowRight}
                  size="xs"
                  className="text-ink-subtle transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none"
                />
              </Link>
            </li>
          ))}
        </ul>

        <p className="mt-10 text-sm text-ink-muted">
          Or go back to the{" "}
          <Link href="/" className="font-semibold text-primary hover:underline">
            home page
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
