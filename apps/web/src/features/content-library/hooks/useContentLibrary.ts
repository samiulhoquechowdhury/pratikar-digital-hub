"use client";

import type { ContentLibraryItem } from "@pratikar/types";
import { useEffect, useState } from "react";

import { contentLibraryApi } from "../api/contentLibraryApi";

/** The catalogue, optionally narrowed to one category. */
export function useContentLibrary(category?: string, enabled = true) {
  const [items, setItems] = useState<ContentLibraryItem[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setIsLoading(true);

    contentLibraryApi
      .list(category)
      .then((result) => {
        if (!cancelled) {
          setItems(result);
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load the content library.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [category, enabled]);

  return { items, isLoading, error };
}
