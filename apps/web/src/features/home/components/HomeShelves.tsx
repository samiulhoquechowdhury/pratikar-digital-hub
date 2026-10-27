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
  /** Null for something not on sale yet. */
  priceInPaise: number | null;
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
export function CatalogueTabs({
  shelves,
  title = "New and popular",
  description = "Ready-made documents, forms and guides — written by advocates.",
  tabsLabel = "Kinds of product",
  viewAllLabel,
}: {
  shelves: Shelf[];
  title?: string;
  description?: string;
  tabsLabel?: string;
  /** The "View all" link's text; by default, the active tab's name. */
  viewAllLabel?: string;
}) {
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
    <section aria-labelledby={`${baseId}-title`} className="bg-white">
      <div className="mx-auto max-w-shell px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2
              id={`${baseId}-title`}
              className="text-[1.75rem] font-bold leading-tight text-noir sm:text-[2.125rem]"
            >
              {title}
            </h2>
            <p className="mt-2 text-lg text-noir/70">{description}</p>
          </div>
          <Link
            href={active.href}
            className="group inline-flex shrink-0 items-center gap-1.5 font-semibold text-noir-raised"
          >
            <span className="link-draw">
              {viewAllLabel ?? `View all ${active.label.toLowerCase()}`}
            </span>
            <Icon
              icon={ArrowRight}
              size="xs"
              className="transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        </div>

        <div
          role="tablist"
          aria-label={tabsLabel}
          className="relative mt-6 flex gap-2 overflow-x-auto pb-1"
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
                className={`relative shrink-0 rounded-full px-4 py-2 text-[0.9375rem] font-semibold transition-colors ${
                  selected
                    ? "bg-noir text-white"
                    : "border border-noir/20 text-noir hover:border-noir hover:bg-ivory"
                }`}
              >
                {shelf.label}
                <span
                  className={`ml-1.5 tabular-nums ${selected ? "text-brand" : "text-noir/50"}`}
                >
                  {shelf.total}
                </span>
              </button>
            );
          })}
        </div>

        <div
          role="tabpanel"
          id={`${baseId}-panel`}
          aria-labelledby={`${baseId}-tab-${active.id}`}
          className="mt-6"
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
        className="relative -mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-px-4 px-4 pb-12 pt-3 -mb-6 -mt-2 [scrollbar-width:none] sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:scroll-px-0 lg:px-0 [&::-webkit-scrollbar]:hidden"
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
          className={`absolute top-[30%] hidden h-12 w-12 place-items-center rounded-full border border-ivory-line bg-white text-noir shadow-float transition-[opacity,background-color,color] hover:bg-ivory disabled:pointer-events-none disabled:opacity-0 lg:grid ${
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
