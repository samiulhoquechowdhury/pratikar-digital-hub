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
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-ink-muted">
        {trail.map((crumb) => (
          <li key={crumb.href} className="flex items-center gap-1.5">
            <Link
              href={crumb.href}
              className="transition-colors hover:text-primary hover:underline"
            >
              {crumb.label}
            </Link>
            <Icon icon={ChevronRight} size="xs" className="text-ink-subtle" />
          </li>
        ))}
        <li aria-current="page" className="truncate font-medium text-ink">
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
          <div className="relative min-w-0 py-10 before:absolute before:inset-y-0 before:-left-[100vw] before:-right-[100vw] before:-z-10 before:border-b before:border-line before:bg-paper lg:col-start-1 lg:row-start-1 lg:py-14">
            {header}
          </div>
          {/* Sticky below the header, so the price and the button stay in
              view while someone reads a long syllabus or list of questions. */}
          <aside className="lg:sticky lg:top-32 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-10 lg:self-start">
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
      <p className="inline-flex items-center gap-2 rounded-full border border-brand-border bg-brand-subtle px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-gold-ink">
        <Icon icon={icon} size="xs" />
        {label}
      </p>
      <h1 className="mt-4 text-4xl leading-[1.1] text-ink sm:text-5xl">
        {title}
      </h1>
      {description && (
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-muted">
          {description}
        </p>
      )}
      <p className="mt-6 flex items-center gap-2.5 text-sm text-ink-muted">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary text-brand">
          <BrandMark className="h-4 w-auto" />
        </span>
        <span>
          From{" "}
          <span className="font-semibold text-ink">Pratikar Digital Hub</span>
        </span>
      </p>
      {meta.length > 0 && (
        // Coursera's fact strip: the numbers someone weighs before buying,
        // in one white card rather than scattered through the text.
        <ul className="mt-7 flex flex-wrap divide-x divide-line overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
          {meta.map((fact) => (
            <li key={fact} className="px-5 py-3 text-sm font-semibold text-ink">
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
    <section className="mt-12 border-t border-line pt-10 first:mt-10 first:border-t-0 first:pt-0">
      <h2 className="text-2xl font-bold">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function FeatureList({ items }: { items: string[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-base text-ink">
          <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-success-subtle text-success-text">
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
    <div className="rounded-2xl border border-line bg-surface p-6 shadow-float">
      {children}
      <ul className="mt-6 space-y-2 border-t border-line pt-5 text-sm text-ink-muted">
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
