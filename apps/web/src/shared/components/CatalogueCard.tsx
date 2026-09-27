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
  { label: string; icon: LucideIcon; tint: string }
> = {
  document: {
    label: "Document template",
    icon: FileText,
    tint: "bg-primary-subtle",
  },
  course: {
    label: "Certificate course",
    icon: GraduationCap,
    tint: "bg-brand-subtle",
  },
  ebook: { label: "E-book", icon: BookOpen, tint: "bg-surface-sunken" },
  checklist: {
    label: "Checklist",
    icon: ListChecks,
    tint: "bg-surface-sunken",
  },
  form: { label: "Form", icon: FileSignature, tint: "bg-surface-sunken" },
};

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
  const { label, icon, tint } = CATALOGUE_KINDS[kind];

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-card border border-line bg-surface transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-raised motion-reduce:transform-none">
      <div aria-hidden className={`flex h-20 items-center px-5 ${tint}`}>
        <span className="grid h-10 w-10 place-items-center rounded-control bg-surface text-primary shadow-card">
          <Icon icon={icon} size="lg" />
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-medium text-ink-subtle">{label}</p>
        <h3 className="mt-1.5 text-base font-semibold leading-snug">
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
