"use client";

import { CONTENT_CATEGORIES, type ContentLibraryItem } from "@pratikar/types";
import { Alert, Button, EmptyState, SkeletonCards } from "@pratikar/ui";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  CatalogueCard,
  CatalogueGrid,
} from "@/shared/components/CatalogueCard";
import {
  ALL,
  CatalogueToolbar,
  matchesQuery,
} from "@/shared/components/CatalogueToolbar";
import { CONTENT_CATEGORY_LABELS, CONTENT_KIND } from "@/shared/lib/labels";
import { categorySlug, LIBRARY_SHELVES } from "@/shared/lib/navigation";

import { useContentLibrary } from "../hooks/useContentLibrary";

/** Cards shown before "Show more" — enough to fill several rows. */
const PAGE_SIZE = 24;

type SortKey = "title" | "price-asc" | "price-desc" | "newest";

const SORTS: Record<
  SortKey,
  {
    label: string;
    compare: (a: ContentLibraryItem, b: ContentLibraryItem) => number;
  }
> = {
  title: {
    label: "Title A–Z",
    compare: (a, b) => a.title.localeCompare(b.title),
  },
  "price-asc": {
    label: "Price: low to high",
    compare: (a, b) => a.priceInPaise - b.priceInPaise,
  },
  "price-desc": {
    label: "Price: high to low",
    compare: (a, b) => b.priceInPaise - a.priceInPaise,
  },
  newest: {
    label: "Newest",
    compare: (a, b) => b.createdAt.localeCompare(a.createdAt),
  },
};

/**
 * The library: e-books, checklists and forms, one shelf per tab.
 *
 * The shelf lives in the URL (`?shelf=forms`) rather than in state, so a
 * shelf is a link that can be shared, bookmarked, and returned to with Back.
 * Category and search are quick, in-page refinements and stay in state.
 *
 * The whole catalogue is fetched once and filtered here — it is a few hundred
 * rows, and filtering locally is what lets the tab counts be exact.
 */
export function ContentLibraryList({
  initial,
}: {
  initial?: ContentLibraryItem[];
} = {}) {
  const searchParams = useSearchParams();
  const shelf =
    LIBRARY_SHELVES.find((s) => s.slug === searchParams.get("shelf")) ?? null;

  const { items, isLoading, error } = useContentLibrary(initial);
  // A category can arrive in the URL, from the home page's topic tiles. It
  // seeds the chip rather than owning it, so picking another chip still works.
  const [category, setCategory] = useState<string>(
    () =>
      CONTENT_CATEGORIES.find(
        (value) => categorySlug(value) === searchParams.get("category"),
      ) ?? ALL,
  );
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("title");
  const [limit, setLimit] = useState(PAGE_SIZE);

  const counts = useMemo(() => {
    const byType = new Map<string, number>();
    for (const item of items) {
      byType.set(item.type, (byType.get(item.type) ?? 0) + 1);
    }
    return byType;
  }, [items]);

  const onShelf = useMemo(
    () => (shelf ? items.filter((item) => item.type === shelf.type) : items),
    [items, shelf],
  );

  // Only categories that have something on this shelf — a chip that always
  // leads to an empty grid is a dead end.
  const categories = useMemo(
    () =>
      CONTENT_CATEGORIES.filter((value) =>
        onShelf.some((item) => item.category === value),
      ).map((value) => ({ value, label: CONTENT_CATEGORY_LABELS[value] })),
    [onShelf],
  );

  const visible = useMemo(
    () =>
      onShelf
        .filter(
          (item) =>
            (category === ALL || item.category === category) &&
            matchesQuery(item.title, query),
        )
        .sort(SORTS[sort].compare),
    [onShelf, category, query, sort],
  );

  // A new filter starts from the top of its own results.
  useEffect(() => setLimit(PAGE_SIZE), [shelf, category, query, sort]);

  const tabs = [
    { slug: null, label: "All", count: items.length },
    ...LIBRARY_SHELVES.map((s) => ({
      slug: s.slug,
      label: s.label,
      count: counts.get(s.type) ?? 0,
    })),
  ];

  return (
    <div className="space-y-8">
      <nav aria-label="Library shelves" className="border-b border-line">
        <ul className="-mb-px flex gap-6 overflow-x-auto">
          {tabs.map((tab) => {
            const active = (shelf?.slug ?? null) === tab.slug;
            return (
              <li key={tab.label} className="shrink-0">
                <Link
                  href={
                    tab.slug
                      ? `/content-library?shelf=${tab.slug}`
                      : "/content-library"
                  }
                  scroll={false}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setCategory(ALL)}
                  className={`flex items-center gap-2 border-b-2 pb-3 text-sm font-medium transition-colors ${
                    active
                      ? "border-primary text-ink"
                      : "border-transparent text-ink-muted hover:border-line-strong hover:text-ink"
                  }`}
                >
                  {tab.label}
                  {!isLoading && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs tabular-nums ${
                        active
                          ? "bg-primary-subtle text-primary"
                          : "bg-surface-sunken text-ink-subtle"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {shelf && <p className="-mt-4 text-sm text-ink-muted">{shelf.hint}.</p>}

      {isLoading ? (
        <SkeletonCards media={false} label="Loading the library…" />
      ) : error ? (
        <Alert tone="danger" role="alert">
          {error}
        </Alert>
      ) : onShelf.length === 0 ? (
        <EmptyState
          title={
            shelf ? `No ${shelf.label.toLowerCase()} yet` : "Nothing here yet"
          }
          description="New titles appear here as they're published."
        />
      ) : (
        <>
          <CatalogueToolbar
            query={query}
            onQueryChange={setQuery}
            searchLabel={`Search ${shelf ? shelf.label.toLowerCase() : "the library"}`}
            options={categories}
            selected={category}
            onSelect={setCategory}
            filterLabel="Category"
          />

          {visible.length === 0 ? (
            <EmptyState
              title="Nothing matched that"
              description="Try a shorter search, or choose All."
            />
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-ink-muted" aria-live="polite">
                  <span className="font-semibold text-ink">
                    {visible.length}
                  </span>{" "}
                  {visible.length === 1 ? "result" : "results"}
                </p>
                <label className="flex items-center gap-2 text-sm text-ink-muted">
                  Sort by
                  <select
                    value={sort}
                    onChange={(event) => setSort(event.target.value as SortKey)}
                    className="h-9 rounded-control border border-line-strong bg-surface px-2 text-sm text-ink"
                  >
                    {(Object.keys(SORTS) as SortKey[]).map((key) => (
                      <option key={key} value={key}>
                        {SORTS[key].label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <CatalogueGrid>
                {visible.slice(0, limit).map((item) => (
                  <li key={item.id}>
                    <CatalogueCard
                      href={`/content-library/${item.id}`}
                      kind={CONTENT_KIND[item.type]}
                      title={item.title}
                      meta={[CONTENT_CATEGORY_LABELS[item.category]]}
                      priceInPaise={item.priceInPaise}
                    />
                  </li>
                ))}
              </CatalogueGrid>
              {visible.length > limit && (
                <div className="flex flex-col items-center gap-2 pt-2">
                  <Button
                    variant="secondary"
                    onClick={() => setLimit((shown) => shown + PAGE_SIZE)}
                  >
                    Show more
                  </Button>
                  <p className="text-xs text-ink-subtle">
                    Showing {limit} of {visible.length}
                  </p>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
