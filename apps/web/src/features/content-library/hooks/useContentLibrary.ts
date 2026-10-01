"use client";

import type { ContentLibraryItem } from "@pratikar/types";

import { useCatalogueData } from "@/shared/hooks/useCatalogueData";

import { contentLibraryApi } from "../api/contentLibraryApi";

/**
 * The whole published library. Shelves and categories are filtered by the
 * caller, which is what lets the shelf tabs show exact counts.
 */
export function useContentLibrary(initial?: ContentLibraryItem[]) {
  const { data, isLoading, error } = useCatalogueData(
    "content-library",
    () => contentLibraryApi.list(),
    "Couldn't load the content library.",
    initial,
  );
  return { items: data ?? [], isLoading, error };
}
