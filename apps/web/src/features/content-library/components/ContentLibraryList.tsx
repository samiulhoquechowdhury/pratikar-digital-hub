"use client";

import {
  CONTENT_CATEGORIES,
  type ContentLibraryItem,
  type ContentType,
} from "@pratikar/types";
import { useMemo } from "react";

import {
  CatalogueBrowser,
  priceFacet,
  type FacetDef,
  type SortDef,
} from "@/shared/catalogue";
import { CatalogueCard } from "@/shared/components/CatalogueCard";
import { CatalogueRow } from "@/shared/components/CatalogueRow";
import { CONTENT_CATEGORY_LABELS, CONTENT_KIND } from "@/shared/lib/labels";
import { categorySlug, LIBRARY_SHELVES } from "@/shared/lib/navigation";

import { useContentLibrary } from "../hooks/useContentLibrary";

const shelfSlug = (type: ContentType) =>
  LIBRARY_SHELVES.find((shelf) => shelf.type === type)?.slug ?? type;

const shelfLabel = (type: ContentType) =>
  LIBRARY_SHELVES.find((shelf) => shelf.type === type)?.label ?? type;

/**
 * Filters by what the thing is, what it's about, and what it costs. The
 * URL parameters "shelf" and "category" are the ones links across the site
 * already use, so those links land on the right filter.
 */
const FACETS: FacetDef<ContentLibraryItem>[] = [
  {
    id: "shelf",
    label: "Type",
    options: LIBRARY_SHELVES.map((shelf) => ({
      value: shelf.slug,
      label: shelf.label,
    })),
    valuesOf: (item) => [shelfSlug(item.type)],
  },
  {
    id: "category",
    label: "Topic",
    options: CONTENT_CATEGORIES.map((category) => ({
      value: categorySlug(category),
      label: CONTENT_CATEGORY_LABELS[category],
    })),
    valuesOf: (item) => [categorySlug(item.category)],
  },
  priceFacet((item) => item.priceInPaise),
];

const SORTS: SortDef<ContentLibraryItem>[] = [
  {
    id: "title",
    label: "Title A–Z",
    compare: (a, b) => a.title.localeCompare(b.title),
  },
  {
    id: "newest",
    label: "Newest first",
    compare: (a, b) => b.createdAt.localeCompare(a.createdAt),
  },
  {
    id: "price-asc",
    label: "Price: low to high",
    compare: (a, b) => a.priceInPaise - b.priceInPaise,
  },
  {
    id: "price-desc",
    label: "Price: high to low",
    compare: (a, b) => b.priceInPaise - a.priceInPaise,
  },
];

/** Title, plus its topic and type, so "property" or "checklist" find things too. */
const searchText = (item: ContentLibraryItem) =>
  `${item.title} ${CONTENT_CATEGORY_LABELS[item.category]} ${shelfLabel(item.type)}`;

/**
 * The library: e-books, checklists and forms — several hundred of them —
 * browsed with search, filters beside the results, and a compact list.
 * The whole catalogue is fetched once and filtered here, which is what lets
 * every filter show an exact count.
 */
export function ContentLibraryList({
  initial,
}: {
  initial?: ContentLibraryItem[];
} = {}) {
  const { items, isLoading, error } = useContentLibrary(initial);
  const keyOf = useMemo(() => (item: ContentLibraryItem) => item.id, []);

  return (
    <CatalogueBrowser
      items={items}
      isLoading={isLoading}
      error={error}
      facets={FACETS}
      sorts={SORTS}
      searchText={searchText}
      searchPlaceholder="Search the library"
      noun={["item", "items"]}
      keyOf={keyOf}
      renderRow={(item) => (
        <CatalogueRow
          href={`/content-library/${item.id}`}
          kind={CONTENT_KIND[item.type]}
          title={item.title}
          meta={[CONTENT_CATEGORY_LABELS[item.category]]}
          priceInPaise={item.priceInPaise}
        />
      )}
      renderCard={(item) => (
        <CatalogueCard
          href={`/content-library/${item.id}`}
          kind={CONTENT_KIND[item.type]}
          title={item.title}
          meta={[CONTENT_CATEGORY_LABELS[item.category]]}
          priceInPaise={item.priceInPaise}
        />
      )}
      emptyTitle="The library is being stocked"
      emptyDescription="New titles appear here as they're published."
    />
  );
}
