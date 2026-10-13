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
    <section
      aria-labelledby={`${baseId}-title`}
      className="mx-auto max-w-shell px-4 py-24 sm:px-6 lg:px-8"
    >
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-2xl">
          <p className="eyebrow">
            <span aria-hidden className="h-px w-6 bg-current" />
            The catalogue
          </p>
          <h2
            id={`${baseId}-title`}
            className="mt-4 text-3xl font-extrabold leading-[1.1] text-ink sm:text-5xl sm:leading-[1.06]"
          >
            Popular right now
          </h2>
        </div>
        <Link
          href={active.href}
          className="group inline-flex items-center gap-2 rounded-full border border-line-strong bg-surface px-5 py-3 text-sm font-semibold text-ink transition-colors hover:border-ink-subtle"
        >
          View all {active.label.toLowerCase()}
          <Icon
            icon={ArrowRight}
            size="xs"
            className="transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none"
          />
        </Link>
      </div>

      <div
        role="tablist"
        aria-label="Kinds of product"
        className="relative mt-8 flex gap-2 overflow-x-auto pb-1"
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
              className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
                selected
                  ? "bg-primary text-ink-inverse"
                  : "border border-line-strong bg-surface text-ink hover:border-ink-subtle"
              }`}
            >
              {shelf.label}
              <span
                className={`ml-2 tabular-nums ${selected ? "text-brand" : "text-ink-subtle"}`}
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
        className="mt-8"
      >
        <Carousel key={active.id} label={active.label} items={active.items} />
        <p className="sr-only" aria-live="polite">
          Showing {active.label}, tab {activeIndex + 1} of {live.length}
        </p>
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
            className="w-[82%] max-w-[20rem] shrink-0 snap-start sm:w-[20rem] lg:w-[17rem]"
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
          className={`absolute top-[30%] hidden h-12 w-12 place-items-center rounded-full border border-line bg-surface text-ink shadow-float transition-opacity hover:bg-paper disabled:pointer-events-none disabled:opacity-0 lg:grid ${
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
