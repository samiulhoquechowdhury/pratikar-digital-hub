import { grossPaise } from "@pratikar/utils";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { formatPrice } from "../lib/format";

import { CATALOGUE_KINDS, type CatalogueKind } from "./CatalogueCard";
import { Icon } from "./Icon";

/**
 * One product as a compact row — the list view of every catalogue.
 *
 * About 64px tall against a card's ~400: when someone is looking for "the
 * affidavit for a lost document" among hundreds, they read titles, and a
 * list shows ten of those for every card. The whole row is the link; only
 * the title is its accessible name.
 */
export function CatalogueRow({
  href,
  kind,
  title,
  meta = [],
  priceInPaise,
}: {
  href: string;
  kind: CatalogueKind;
  title: string;
  /** Short facts — the topic, "8 questions" — shown under the title. */
  meta?: string[];
  /** The list price, before GST. Shown GST-inclusive, as checkout charges. */
  priceInPaise: number;
}) {
  const { label, icon, cover } = CATALOGUE_KINDS[kind];

  return (
    <article className="group relative flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-surface-sunken sm:px-5">
      <span
        aria-hidden
        className={`grid h-11 w-11 shrink-0 place-items-center rounded-control text-brand ${cover}`}
      >
        <Icon icon={icon} size="md" />
      </span>

      <div className="min-w-0 flex-1">
        <h3 className="text-[0.9375rem] font-semibold leading-snug">
          <Link
            href={href}
            className="line-clamp-2 text-ink transition-colors after:absolute after:inset-0 after:content-[''] group-hover:text-primary"
          >
            {title}
          </Link>
        </h3>
        <p className="mt-0.5 truncate text-xs text-ink-muted">
          {[label, ...meta].join(" · ")}
        </p>
      </div>

      <p className="shrink-0 text-right">
        <span className="block text-[0.9375rem] font-semibold tabular-nums text-ink">
          {formatPrice(grossPaise(priceInPaise))}
        </span>
        <span className="block text-[0.6875rem] text-ink-subtle">
          incl. GST
        </span>
      </p>
      <Icon
        icon={ChevronRight}
        className="hidden shrink-0 text-ink-subtle transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none sm:block"
      />
    </article>
  );
}
