import { BrandMark } from "@pratikar/ui";
import { grossPaise } from "@pratikar/utils";
import {
  ArrowUpRight,
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
 * Each kind gets an icon, a label, a tint for its compact row tile and a
 * cover scheme. The colours are decoration only — the icon and the words say
 * what the thing is, so nothing here depends on telling colours apart.
 */
export const CATALOGUE_KINDS: Record<
  CatalogueKind,
  {
    label: string;
    icon: LucideIcon;
    /** The compact row's icon tile. */
    cover: string;
    /** The card cover's ground; `dark` covers carry light chips. */
    ground: string;
    dark: boolean;
  }
> = {
  document: {
    label: "Document template",
    icon: FileText,
    cover: "bg-primary",
    ground: "bg-hero-navy",
    dark: true,
  },
  course: {
    label: "Certificate course",
    icon: GraduationCap,
    cover: "bg-surface-inverse-deep",
    ground: "bg-cover-course",
    dark: true,
  },
  ebook: {
    label: "E-book",
    icon: BookOpen,
    cover: "bg-surface-inverse",
    ground: "bg-cover-ebook",
    dark: false,
  },
  checklist: {
    label: "Checklist",
    icon: ListChecks,
    cover: "bg-surface-inverse-raised",
    ground: "bg-cover-checklist",
    dark: false,
  },
  form: {
    label: "Form",
    icon: FileSignature,
    cover: "bg-surface-inverse",
    ground: "bg-cover-form",
    dark: false,
  },
};

/** A few ruled lines, as on a printed page. */
function Lines({
  count,
  className = "",
}: {
  count: number;
  className?: string;
}) {
  const widths = ["w-full", "w-11/12", "w-10/12", "w-full", "w-9/12"];
  return (
    <span className={`block space-y-1.5 ${className}`}>
      {Array.from({ length: count }, (_, index) => (
        <span
          key={index}
          className={`block h-1 rounded-full bg-navy-100 ${widths[index % widths.length]}`}
        />
      ))}
    </span>
  );
}

/**
 * A product's cover — what a photograph is on Coursera, drawn instead: the
 * thing itself, in miniature. A document or form is a sheet of paper with
 * the title set on it, a checklist has its ticks, an e-book is a bound book
 * and a course is a video frame. Every item gets one without anyone
 * designing 450 images, and they can never go stale against the title.
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
  const { label, icon, ground, dark } = CATALOGUE_KINDS[kind];
  return (
    <div
      aria-hidden
      className={`relative aspect-[16/9] select-none overflow-hidden ${ground} ${className}`}
    >
      <span
        className={`absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[0.625rem] font-bold uppercase tracking-[0.1em] ${
          dark
            ? "bg-white/10 text-brand ring-1 ring-white/15 backdrop-blur"
            : "bg-surface/80 text-primary ring-1 ring-black/5 backdrop-blur"
        }`}
      >
        <Icon icon={icon} size="xs" />
        {label}
      </span>

      {kind === "ebook" ? (
        // A bound book, standing on the cover.
        <span className="absolute bottom-0 left-1/2 top-9 flex w-[42%] -translate-x-1/2 translate-y-3 rotate-[-4deg] overflow-hidden rounded-r-md rounded-l-sm bg-primary shadow-[8px_10px_24px_-6px_rgb(11_31_58/0.55)] transition-transform duration-500 group-hover:-translate-y-0 group-hover:rotate-[-2deg] motion-reduce:transform-none">
          <span className="w-2.5 shrink-0 bg-gradient-to-r from-navy-950 to-navy-700" />
          <span className="flex min-w-0 flex-1 flex-col p-3">
            <span className="h-0.5 w-6 rounded-full bg-brand" />
            <span className="mt-2 line-clamp-4 font-serif text-[0.7rem] font-semibold leading-tight text-ink-inverse">
              {title}
            </span>
            <span className="mt-auto text-[0.5rem] font-bold uppercase tracking-[0.18em] text-brand">
              Pratikar
            </span>
          </span>
        </span>
      ) : kind === "course" ? (
        // A video frame with a play button and a progress bar.
        <span className="absolute inset-x-6 bottom-0 top-10 translate-y-2 rounded-t-lg bg-surface/10 p-3 ring-1 ring-white/15 backdrop-blur-sm transition-transform duration-500 group-hover:translate-y-0 motion-reduce:transform-none">
          <span className="line-clamp-2 font-display text-[0.8rem] font-semibold leading-snug text-ink-inverse">
            {title}
          </span>
          <span className="absolute left-1/2 top-[58%] grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-brand text-on-brand shadow-raised">
            <svg
              viewBox="0 0 12 12"
              className="ml-0.5 h-3.5 w-3.5"
              fill="currentColor"
            >
              <path d="M3 1.8v8.4L10 6z" />
            </svg>
          </span>
          <span className="absolute inset-x-3 bottom-3 h-1 rounded-full bg-white/15">
            <span className="block h-full w-2/5 rounded-full bg-brand" />
          </span>
        </span>
      ) : (
        // A sheet of paper rising from the bottom edge.
        <span className="absolute bottom-0 left-[18%] right-[18%] top-10 translate-y-3 rotate-[-2deg] rounded-t-md bg-surface px-4 pt-3.5 shadow-[0_-4px_24px_-6px_rgb(11_31_58/0.35)] transition-transform duration-500 group-hover:translate-y-1 group-hover:rotate-0 motion-reduce:transform-none">
          <span className="line-clamp-2 text-center font-serif text-[0.72rem] font-semibold leading-tight text-ink">
            {title}
          </span>
          <span className="mx-auto mt-2 block h-px w-8 bg-brand" />
          {kind === "checklist" ? (
            <span className="mt-2.5 block space-y-1.5">
              {[true, true, false].map((done, index) => (
                <span key={index} className="flex items-center gap-1.5">
                  <span
                    className={`grid h-2.5 w-2.5 shrink-0 place-items-center rounded-[3px] ${done ? "bg-success" : "border border-navy-200"}`}
                  >
                    {done && (
                      <svg
                        viewBox="0 0 12 12"
                        className="h-2 w-2 text-ink-inverse"
                      >
                        <path
                          d="M2.5 6.2 5 8.5 9.5 3.8"
                          stroke="currentColor"
                          strokeWidth="2"
                          fill="none"
                        />
                      </svg>
                    )}
                  </span>
                  <span className="h-1 flex-1 rounded-full bg-navy-100" />
                </span>
              ))}
            </span>
          ) : (
            <Lines count={4} className="mt-2.5" />
          )}
        </span>
      )}
    </div>
  );
}

/**
 * One product, as every grid on the site shows it: documents, courses, and
 * each library shelf. One component so the storefront reads as one shop —
 * and laid out the way Coursera lays out a course: the cover inset in the
 * card, who it's from, the title, then the facts and the price.
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
    <article className="group relative flex h-full flex-col rounded-2xl border border-line bg-surface p-2 transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-1 hover:border-line-strong hover:shadow-float motion-reduce:transform-none">
      <CatalogueCover kind={kind} title={title} className="rounded-xl" />

      <div className="flex flex-1 flex-col px-3 pb-3 pt-4">
        <p className="flex items-center gap-2 text-xs font-medium text-ink-muted">
          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-primary text-brand">
            <BrandMark className="h-3 w-auto" />
          </span>
          Pratikar Digital Hub
        </p>
        <h3 className="mt-2.5 font-display text-base font-bold leading-snug tracking-tight">
          <Link
            href={href}
            className="line-clamp-2 text-ink transition-colors after:absolute after:inset-0 after:content-[''] group-hover:text-primary"
          >
            {title}
          </Link>
        </h3>
        {description && (
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ink-muted">
            {description}
          </p>
        )}

        <div className="mt-auto pt-4">
          {meta.length > 0 && (
            <p className="text-xs text-ink-subtle">{meta.join(" · ")}</p>
          )}
          {/* GST-inclusive on every card, matching what checkout charges.
              Templates showed the total and courses the bare price, so the
              same shop quoted two different kinds of number. */}
          <p className="mt-3 flex items-baseline justify-between gap-2 border-t border-line pt-3">
            <span className="flex items-baseline gap-1.5">
              <span className="font-display text-lg font-bold tabular-nums text-ink">
                {formatPrice(grossPaise(priceInPaise))}
              </span>
              <span className="text-xs text-ink-subtle">incl. GST</span>
            </span>
            <Icon
              icon={ArrowUpRight}
              className="text-ink-subtle transition-[color,transform] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary motion-reduce:transform-none"
            />
          </p>
        </div>
      </div>
    </article>
  );
}

/** The grid every catalogue uses, so the columns line up site-wide. */
export function CatalogueGrid({ children }: { children: React.ReactNode }) {
  return (
    <ul className="grid grid-cols-[minmax(0,1fr)] gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {children}
    </ul>
  );
}
