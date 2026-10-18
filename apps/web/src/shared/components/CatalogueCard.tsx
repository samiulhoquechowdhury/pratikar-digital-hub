import { BrandMark } from "@pratikar/ui";
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
    ground: "bg-noir-glow",
    dark: true,
  },
  course: {
    label: "Certificate course",
    icon: GraduationCap,
    cover: "bg-surface-inverse-deep",
    ground: "bg-noir",
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
    ground: "bg-ivory-deep",
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
          className={`block h-[3px] bg-noir/10 ${widths[index % widths.length]}`}
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
        className={`absolute left-4 top-4 z-10 inline-flex items-center gap-1.5 text-sm font-semibold ${
          dark ? "text-brand" : "text-noir/70"
        }`}
      >
        <Icon icon={icon} size="xs" />
        {label}
      </span>

      {kind === "ebook" ? (
        // A bound book, standing on the cover.
        <span className="absolute bottom-0 left-1/2 top-9 flex w-[42%] -translate-x-1/2 translate-y-3 rotate-[-4deg] overflow-hidden bg-noir shadow-[8px_10px_24px_-6px_rgb(11_31_58/0.55)] transition-transform duration-500 group-hover:-translate-y-0 group-hover:rotate-[-2deg] motion-reduce:transform-none">
          <span className="w-2.5 shrink-0 bg-gradient-to-r from-navy-950 to-navy-700" />
          <span className="flex min-w-0 flex-1 flex-col p-3">
            <span className="h-0.5 w-6 bg-gold-foil" />
            <span className="mt-2 line-clamp-4 font-display text-[0.75rem] leading-tight text-ivory">
              {title}
            </span>
            <span className="mt-auto text-[0.5rem] font-bold text-brand">
              Pratikar
            </span>
          </span>
        </span>
      ) : kind === "course" ? (
        // A video frame with a play button and a progress bar.
        <span className="absolute inset-x-6 bottom-0 top-10 translate-y-2 border border-white/15 bg-white/[0.04] p-3 backdrop-blur-sm transition-transform duration-500 group-hover:translate-y-0 motion-reduce:transform-none">
          <span className="line-clamp-2 font-display text-[0.85rem] leading-snug text-ivory">
            {title}
          </span>
          <span className="absolute left-1/2 top-[58%] grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-gold-foil text-noir shadow-raised">
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
        <span className="absolute bottom-0 left-[18%] right-[18%] top-10 translate-y-3 rotate-[-2deg] bg-ivory px-4 pt-4 shadow-[0_-6px_30px_-8px_rgb(6_12_23/0.4)] transition-transform duration-500 group-hover:translate-y-1 group-hover:rotate-0 motion-reduce:transform-none">
          <span className="line-clamp-2 text-center font-display text-[0.78rem] leading-tight text-noir">
            {title}
          </span>
          <span className="mx-auto mt-2 block h-px w-8 bg-gold-foil" />
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
                  <span className="h-[3px] flex-1 bg-noir/10" />
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
    <article className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-ivory-line bg-white transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-float motion-reduce:transform-none">
      <CatalogueCover kind={kind} title={title} />

      <div className="flex flex-1 flex-col p-4">
        <p className="flex items-center gap-2 text-sm text-noir/70">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded border border-ivory-line bg-white text-noir">
            <BrandMark className="h-3.5 w-auto" />
          </span>
          Pratikar Digital Hub
        </p>
        <h3 className="mt-2.5 font-display text-base font-bold leading-snug tracking-normal">
          <Link
            href={href}
            className="line-clamp-2 text-noir after:absolute after:inset-0 after:content-[''] group-hover:underline"
          >
            {title}
          </Link>
        </h3>
        {description && (
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-noir/65">
            {description}
          </p>
        )}

        <div className="mt-auto pt-3">
          <p className="text-sm text-noir/60">
            {[CATALOGUE_KINDS[kind].label, ...meta].join(" · ")}
          </p>
          {/* GST-inclusive on every card, matching what checkout charges. */}
          <p className="mt-2 flex items-baseline gap-1.5">
            <span className="text-lg font-bold tabular-nums text-noir">
              {formatPrice(grossPaise(priceInPaise))}
            </span>
            <span className="text-xs text-noir/55">incl. GST</span>
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
