import { BrandMark } from "@pratikar/ui";
import { Check, ChevronRight, ShieldCheck, Receipt } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { CATALOGUE_KINDS, type CatalogueKind } from "./CatalogueCard";
import { Icon } from "./Icon";

/**
 * The building blocks every product page shares — a template, a course, a
 * library item — so the three read as one shop: where you are, what it is,
 * what you get, and one panel that says what it costs and how to get it.
 */

export function Breadcrumbs({
  trail,
  current,
}: {
  trail: { href: string; label: string }[];
  current: string;
}) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-2 text-sm font-semibold text-noir/50">
        {trail.map((crumb) => (
          <li key={crumb.href} className="flex items-center gap-1.5">
            <Link
              href={crumb.href}
              className="link-draw transition-colors hover:text-noir"
            >
              {crumb.label}
            </Link>
            <Icon icon={ChevronRight} size="xs" className="text-ink-subtle" />
          </li>
        ))}
        <li aria-current="page" className="truncate text-noir">
          {current}
        </li>
      </ol>
    </nav>
  );
}

/**
 * Content on the left, the purchase panel pinned on the right — under a warm
 * paper title band, with the panel floating over its edge, the way Coursera
 * presents a course.
 *
 * Three slots rather than two so the phone order can differ from the desktop
 * one: on a phone the panel comes straight after the title — price and the
 * button a scroll away from the top, not below a long syllabus — while on a
 * desktop it sits in its own sticky column beside everything.
 *
 * The band is the header cell's own background, stretched to the viewport's
 * edges, so it is exactly as tall as the title it holds; the wrapper clips
 * the overhang without becoming a scroll container, so the panel can still
 * stick.
 */
export function ProductLayout({
  header,
  aside,
  children,
}: {
  header: ReactNode;
  aside: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="overflow-x-clip">
      <div className="mx-auto max-w-shell px-4 pb-8 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-x-16 lg:gap-y-0">
          <div className="relative min-w-0 py-10 before:absolute before:inset-y-0 before:-left-[100vw] before:-right-[100vw] before:-z-10 before:border-b before:border-ivory-line before:bg-ivory lg:col-start-1 lg:row-start-1 lg:py-16">
            {header}
          </div>
          {/* Sticky below the header, so the price and the button stay in
              view while someone reads a long syllabus or list of questions. */}
          <aside className="lg:sticky lg:top-28 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-10 lg:self-start">
            {aside}
          </aside>
          {children && (
            <div className="min-w-0 lg:col-start-1 lg:row-start-2">
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ProductHeading({
  kind,
  title,
  description,
  meta = [],
}: {
  kind: CatalogueKind;
  title: string;
  description?: ReactNode;
  meta?: string[];
}) {
  const { label, icon } = CATALOGUE_KINDS[kind];
  return (
    <header className="mt-6">
      <p className="inline-flex items-center gap-2 text-sm font-semibold text-gold-ink">
        <Icon icon={icon} size="xs" />
        {label}
      </p>
      <h1 className="mt-4 text-4xl font-bold leading-tight text-noir sm:text-5xl">
        {title}
      </h1>
      {description && (
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-noir/65">
          {description}
        </p>
      )}
      <p className="mt-7 flex items-center gap-3 text-sm text-noir/60">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-noir text-brand">
          <BrandMark className="h-4 w-auto" />
        </span>
        <span>
          From{" "}
          <span className="font-semibold text-noir">Pratikar Digital Hub</span>{" "}
          · written by practising advocates
        </span>
      </p>
      {meta.length > 0 && (
        // Coursera's fact strip: the numbers someone weighs before buying,
        // in one white card rather than scattered through the text.
        <ul className="mt-8 flex flex-wrap divide-x divide-ivory-line border border-ivory-line bg-surface">
          {meta.map((fact) => (
            <li
              key={fact}
              className="px-5 py-3.5 text-sm font-semibold text-noir"
            >
              {fact}
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}

/** A titled block of the page body. */
export function ProductSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-14 border-t border-ivory-line pt-12 first:mt-12 first:border-t-0 first:pt-0">
      <h2 className="text-3xl font-bold text-noir">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function FeatureList({ items }: { items: string[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-base text-ink">
          <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border border-gold-ink/40 text-gold-ink">
            <Icon icon={Check} size="xs" />
          </span>
          {item}
        </li>
      ))}
    </ul>
  );
}

/**
 * The purchase panel. The two lines under it are facts about how every
 * purchase works — Razorpay takes the payment, and a GST invoice is issued —
 * which is what someone paying a new site for the first time wants to know.
 */
export function PurchaseCard({ children }: { children: ReactNode }) {
  return (
    <div className="border border-ivory-line bg-surface p-7 shadow-[0_40px_80px_-40px_rgb(6_12_23/0.35)]">
      <div aria-hidden className="-mx-7 -mt-7 mb-6 h-0.5 bg-gold-foil" />
      {children}
      <ul className="mt-6 space-y-2 border-t border-ivory-line pt-5 text-sm text-noir/60">
        <li className="flex items-center gap-2">
          <Icon icon={ShieldCheck} className="text-ink-subtle" />
          Secure payment through Razorpay
        </li>
        <li className="flex items-center gap-2">
          <Icon icon={Receipt} className="text-ink-subtle" />
          GST invoice with every purchase
        </li>
      </ul>
    </div>
  );
}
