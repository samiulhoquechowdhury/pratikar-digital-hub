import { grossPaise } from "@pratikar/utils";
import {
  BookOpen,
  FileSignature,
  FileText,
  GraduationCap,
  ListChecks,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

import { formatPrice } from "../lib/format";

import { Icon } from "./Icon";

export type CatalogueKind =
  "document" | "course" | "ebook" | "checklist" | "form";

/**
 * Each kind gets an icon, a label and a tint. The tint is decoration only —
 * the icon and the words say what the thing is, so nothing here depends on
 * telling colours apart.
 */
export const CATALOGUE_KINDS: Record<
  CatalogueKind,
  { label: string; icon: LucideIcon; cover: string }
> = {
  document: {
    label: "Document template",
    icon: FileText,
    cover: "bg-primary",
  },
  course: {
    label: "Certificate course",
    icon: GraduationCap,
    cover: "bg-surface-inverse-deep",
  },
  ebook: { label: "E-book", icon: BookOpen, cover: "bg-surface-inverse" },
  checklist: {
    label: "Checklist",
    icon: ListChecks,
    cover: "bg-surface-inverse-raised",
  },
  form: { label: "Form", icon: FileSignature, cover: "bg-surface-inverse" },
};

/**
 * A product's cover — what a photograph is on Udemy or Coursera, drawn
 * instead: the kind, the title set like a book jacket, and the brand's gold
 * rule. Every item gets one without anyone designing 450 images, and they
 * can never go stale against the title.
 *
 * Decorative: the card's own heading carries the title for screen readers.
 */
export function CatalogueCover({
  kind,
  title,
  className = "",
}: {
  kind: CatalogueKind;
  title: string;
  className?: string;
}) {
  const { label, icon, cover } = CATALOGUE_KINDS[kind];
  return (
    <div
      aria-hidden
      className={`relative flex aspect-[16/9] flex-col overflow-hidden p-5 ${cover} ${className}`}
    >
      {/* A book's spine for e-books; a soft light for everything else. */}
      {kind === "ebook" ? (
        <span className="absolute inset-y-0 left-0 w-3 bg-brand/80" />
      ) : (
        <span className="absolute inset-0 bg-[radial-gradient(18rem_10rem_at_100%_0%,theme(colors.navy.500/45%),transparent_70%)]" />
      )}
      <span className="absolute -bottom-4 -right-3 text-ink-inverse opacity-[0.07]">
        <Icon icon={icon} size="lg" className="h-28 w-28" />
      </span>

      <span className="relative flex items-center gap-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-brand">
        <Icon icon={icon} size="xs" />
        {label}
      </span>
      <span className="relative mt-auto line-clamp-3 font-display text-lg font-semibold leading-snug text-ink-inverse">
        {title}
      </span>
      <span className="relative mt-3 h-0.5 w-10 rounded-full bg-brand" />
    </div>
  );
}

/**
 * One product, as every grid on the site shows it: documents, courses, and
 * each library shelf. One component so the storefront reads as one shop.
 *
 * The whole card is the link target, but only the title is the link's
 * accessible name — a screen reader hears "Rent Agreement, link", not the
 * price, the badges and the description run together.
 *
 * No ratings or enrolment counts: the catalogue has neither, and inventing
 * them on a site selling legal material is the wrong first impression.
 */
export function CatalogueCard({
  href,
  kind,
  title,
  description,
  meta = [],
  priceInPaise,
}: {
  href: string;
  kind: CatalogueKind;
  title: string;
  description?: string | null;
  /** Short facts — "12 lessons", "Property" — shown as a quiet line. */
  meta?: string[];
  /** The list price, before GST. The card adds GST for display. */
  priceInPaise: number;
}) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-card border border-line bg-surface transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-raised motion-reduce:transform-none">
      <CatalogueCover kind={kind} title={title} />

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-base font-semibold leading-snug">
          <Link
            href={href}
            className="text-ink transition-colors after:absolute after:inset-0 after:content-[''] group-hover:text-primary"
          >
            {title}
          </Link>
        </h3>
        {description && (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-muted">
            {description}
          </p>
        )}

        <div className="mt-auto pt-5">
          {meta.length > 0 && (
            <p className="text-sm text-ink-muted">{meta.join(" · ")}</p>
          )}
          {/* GST-inclusive on every card, matching what checkout charges.
              Templates showed the total and courses the bare price, so the
              same shop quoted two different kinds of number. */}
          <p className="mt-3 flex items-baseline gap-1.5 border-t border-line pt-3">
            <span className="text-lg font-semibold tabular-nums text-ink">
              {formatPrice(grossPaise(priceInPaise))}
            </span>
            <span className="text-xs text-ink-subtle">incl. GST</span>
          </p>
        </div>
      </div>
    </article>
  );
}

/** The grid every catalogue uses, so the columns line up site-wide. */
export function CatalogueGrid({ children }: { children: React.ReactNode }) {
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {children}
    </ul>
  );
}
