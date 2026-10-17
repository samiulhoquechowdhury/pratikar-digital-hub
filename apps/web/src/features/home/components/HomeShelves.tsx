"use client";

import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

import {
  CatalogueCard,
  type CatalogueKind,
} from "@/shared/components/CatalogueCard";
import { Icon } from "@/shared/components/Icon";

/** One product, already shaped for a card — prepared on the server. */
export interface ShelfItem {
  id: string;
  href: string;
  kind: CatalogueKind;
  title: string;
  meta: string[];
  priceInPaise: number;
}

export interface Shelf {
  id: string;
  label: string;
  /** Where "View all" goes for this tab. */
  href: string;
  /** How many there are in all — the tab's count, not just the cards shown. */
  total: number;
  items: ShelfItem[];
}

/**
 * Coursera's "New and popular": one heading, a row of tabs, and a carousel
 * of cards under them with arrows on wide screens and a swipe on phones.
 *
 * The data arrives ready from the server page — a few cards per tab, not the
 * whole catalogue — so the section is in the HTML and costs no request.
 * Tabs with nothing in them are left out; with none at all, so is the
 * section.
 */
export function CatalogueTabs({ shelves }: { shelves: Shelf[] }) {
  const live = shelves.filter((shelf) => shelf.items.length > 0);
  // Open on the first tab with enough cards to fill a row, so the section
  // doesn't greet people with two cards and a blank space.
  const [activeId, setActiveId] = useState(
    (live.find((shelf) => shelf.items.length >= 4) ?? live[0])?.id,
  );
  const baseId = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  if (live.length === 0) return null;
  const active = live.find((shelf) => shelf.id === activeId) ?? live[0]!;
  const activeIndex = live.indexOf(active);

  /** Arrow keys move between tabs, as the ARIA tabs pattern expects. */
  const onTabKey = (event: React.KeyboardEvent, index: number) => {
    const step =
      event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const next = (index + step + live.length) % live.length;
    setActiveId(live[next]!.id);
    tabRefs.current[next]?.focus();
  };

  return (
    <section aria-labelledby={`${baseId}-title`} className="bg-ivory">
      <div className="mx-auto max-w-shell px-4 py-28 sm:px-6 sm:py-36 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="flex items-center gap-4">
              <span className="font-display text-lg italic text-brand">03</span>
              <span aria-hidden className="h-px w-10 bg-noir/20" />
              <span className="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-noir/55">
                The catalogue
              </span>
            </p>
            <h2
              id={`${baseId}-title`}
              className="mt-6 text-4xl font-light leading-[1.04] text-noir sm:text-6xl"
            >
              Most sought <span className="accent-serif">this season.</span>
            </h2>
          </div>
          <Link
            href={active.href}
            className="group inline-flex shrink-0 items-center gap-3 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-noir"
          >
            <span className="link-draw">
              View all {active.label.toLowerCase()}
            </span>
            <span className="grid h-10 w-10 place-items-center rounded-full border border-noir/20 transition-colors group-hover:border-noir group-hover:bg-noir group-hover:text-ivory">
              <Icon icon={ArrowRight} size="xs" />
            </span>
          </Link>
        </div>

        <div
          role="tablist"
          aria-label="Kinds of product"
          className="relative mt-14 flex gap-8 overflow-x-auto border-b border-noir/15"
        >
          {live.map((shelf, index) => {
            const selected = shelf.id === active.id;
            return (
              <button
                key={shelf.id}
                ref={(node) => {
                  tabRefs.current[index] = node;
                }}
                type="button"
                role="tab"
                id={`${baseId}-tab-${shelf.id}`}
                aria-selected={selected}
                aria-controls={`${baseId}-panel`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActiveId(shelf.id)}
                onKeyDown={(event) => onTabKey(event, index)}
                className={`relative shrink-0 pb-4 text-[0.7rem] font-semibold uppercase tracking-[0.22em] transition-colors ${
                  selected ? "text-noir" : "text-noir/45 hover:text-noir/80"
                }`}
              >
                {shelf.label}
                <sup className="ml-1.5 font-display text-xs normal-case italic tracking-normal text-gold-ink">
                  {shelf.total}
                </sup>
                <span
                  aria-hidden
                  className={`absolute inset-x-0 -bottom-px h-0.5 origin-left bg-noir transition-transform duration-500 ${
                    selected ? "scale-x-100" : "scale-x-0"
                  }`}
                />
              </button>
            );
          })}
        </div>

        <div
          role="tabpanel"
          id={`${baseId}-panel`}
          aria-labelledby={`${baseId}-tab-${active.id}`}
          className="mt-10"
        >
          <Carousel key={active.id} label={active.label} items={active.items} />
          <p className="sr-only" aria-live="polite">
            Showing {active.label}, tab {activeIndex + 1} of {live.length}
          </p>
        </div>
      </div>
    </section>
  );
}

/**
 * A horizontal row of cards. Scroll-snap does the swiping on touch; the
 * arrows page through it on wide screens and disappear at either end.
 */
function Carousel({ label, items }: { label: string; items: ShelfItem[] }) {
  const track = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  useEffect(() => {
    const node = track.current;
    if (!node) return;
    const update = () =>
      setEdges({
        start: node.scrollLeft <= 4,
        end: node.scrollLeft + node.clientWidth >= node.scrollWidth - 4,
      });
    update();
    node.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      node.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const page = (direction: 1 | -1) =>
    track.current?.scrollBy({
      left: direction * track.current.clientWidth * 0.85,
      behavior: "smooth",
    });

  return (
    <div className="relative">
      <ul
        ref={track}
        aria-label={label}
        className="relative -mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-px-4 px-4 pb-6 pt-1 [scrollbar-width:none] sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:scroll-px-0 lg:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item) => (
          <li
            key={item.id}
            className="w-[82%] max-w-[20rem] shrink-0 snap-start sm:w-[20rem] lg:w-[17.5rem]"
          >
            <CatalogueCard
              href={item.href}
              kind={item.kind}
              title={item.title}
              meta={item.meta}
              priceInPaise={item.priceInPaise}
            />
          </li>
        ))}
      </ul>

      {[
        { direction: -1 as const, hidden: edges.start, icon: ChevronLeft },
        { direction: 1 as const, hidden: edges.end, icon: ChevronRight },
      ].map((arrow) => (
        <button
          key={arrow.direction}
          type="button"
          onClick={() => page(arrow.direction)}
          disabled={arrow.hidden}
          className={`absolute top-[30%] hidden h-14 w-14 place-items-center rounded-full border border-noir/15 bg-ivory text-noir shadow-float transition-[opacity,background-color,color] hover:bg-noir hover:text-ivory disabled:pointer-events-none disabled:opacity-0 lg:grid ${
            arrow.direction === -1 ? "-left-6" : "-right-6"
          }`}
        >
          <Icon
            icon={arrow.icon}
            size="md"
            label={arrow.direction === -1 ? "Previous" : "Next"}
          />
        </button>
      ))}
    </div>
  );
}
