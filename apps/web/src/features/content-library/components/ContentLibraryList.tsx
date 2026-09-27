"use client";

import { CONTENT_CATEGORIES } from "@pratikar/types";
import { Alert, EmptyState, SkeletonCards } from "@pratikar/ui";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

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
import { LIBRARY_SHELVES } from "@/shared/lib/navigation";

import { useContentLibrary } from "../hooks/useContentLibrary";

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
export function ContentLibraryList() {
  const searchParams = useSearchParams();
  const shelf =
    LIBRARY_SHELVES.find((s) => s.slug === searchParams.get("shelf")) ?? null;

  const { items, isLoading, error } = useContentLibrary();
  const [category, setCategory] = useState(ALL);
  const [query, setQuery] = useState("");

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
      onShelf.filter(
        (item) =>
          (category === ALL || item.category === category) &&
          matchesQuery(item.title, query),
      ),
    [onShelf, category, query],
  );

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
            <CatalogueGrid>
              {visible.map((item) => (
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
          )}
        </>
      )}
    </div>
  );
}
