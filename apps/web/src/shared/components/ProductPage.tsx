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
              className="transition-colors hover:text-ink"
            >
              {crumb.label}
            </Link>
            <Icon icon={ChevronRight} size="xs" className="text-ink-subtle" />
          </li>
        ))}
        <li aria-current="page" className="truncate text-ink">
          {current}
        </li>
      </ol>
    </nav>
  );
}

/**
 * Content on the left, the purchase panel pinned on the right.
 *
 * Three slots rather than two so the phone order can differ from the desktop
 * one: on a phone the panel comes straight after the title — price and the
 * button a scroll away from the top, not below a long syllabus — while on a
 * desktop it sits in its own sticky column beside everything.
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
    <div className="mx-auto max-w-shell px-4 pb-8 pt-8 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-x-16 lg:gap-y-0">
        <div className="min-w-0 lg:col-start-1 lg:row-start-1">{header}</div>
        {/* Sticky below the header, so the price and the button stay in view
            while someone reads a long syllabus or list of questions. */}
        <aside className="lg:sticky lg:top-24 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start">
          {aside}
        </aside>
        {children && (
          <div className="min-w-0 lg:col-start-1 lg:row-start-2">
            {children}
          </div>
        )}
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
      <p className="flex items-center gap-2 text-sm font-medium text-primary">
        <Icon icon={icon} />
        {label}
      </p>
      <h1 className="mt-3 text-4xl sm:text-5xl">{title}</h1>
      {description && (
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-muted">
          {description}
        </p>
      )}
      {meta.length > 0 && (
        <ul className="mt-6 flex flex-wrap gap-2">
          {meta.map((fact) => (
            <li
              key={fact}
              className="rounded-full border border-line px-3 py-1 text-sm text-ink-muted"
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
    <section className="mt-12 border-t border-line pt-10">
      <h2 className="text-xl font-semibold">{title}</h2>
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
    <div className="rounded-card border border-line bg-surface p-6 shadow-raised">
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
