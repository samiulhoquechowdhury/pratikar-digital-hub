"use client";

import type { ContentLibraryItem, Course, Template } from "@pratikar/types";
import { useEffect, useState } from "react";

import { contentLibraryApi } from "@/features/content-library/api/contentLibraryApi";
import { documentsApi } from "@/features/documents/api/documentsApi";
import { lmsApi } from "@/features/lms/api/lmsApi";

export interface SiteSearchResults {
  templates: Template[];
  courses: Course[];
  library: ContentLibraryItem[];
}

const EMPTY: SiteSearchResults = { templates: [], courses: [], library: [] };

const matches = (haystack: string | null | undefined, needle: string) =>
  (haystack ?? "").toLowerCase().includes(needle);

/**
 * Site-wide search.
 *
 * Filtering happens in the browser over the full published catalogue rather
 * than against a search endpoint, because there isn't one — the catalogues are
 * small enough (hundreds of rows) that this is honest rather than clever. It
 * will need a real query API before the client's 100 templates and 500
 * checklists are all loaded.
 *
 * All three catalogues are public, so a visitor searches the same catalogue
 * a customer does. If one of them fails to load, the others still show and
 * `incomplete` says so — a blank page would read as "nothing matched".
 */
export function useSiteSearch(query: string) {
  const [results, setResults] = useState<SiteSearchResults>(EMPTY);
  const [isLoading, setIsLoading] = useState(true);
  const [incomplete, setIncomplete] = useState(false);

  useEffect(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      setResults(EMPTY);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    // A failure in one catalogue must not blank the other two.
    let failed = false;
    const settle = <T>(promise: Promise<T[]>, mark?: () => void) =>
      promise.catch(() => {
        mark?.();
        return [] as T[];
      });

    // `void`: every branch is already settled by `settle` above, so there is
    // no rejection left for a handler to catch.
    void Promise.all([
      settle(documentsApi.listTemplates(), () => (failed = true)),
      settle(lmsApi.list(), () => (failed = true)),
      settle(contentLibraryApi.list(), () => (failed = true)),
    ])
      .then(([templates, courses, library]) => {
        if (cancelled) return;

        setIncomplete(failed);
        setResults({
          templates: templates.filter(
            (t) => matches(t.title, needle) || matches(t.category, needle),
          ),
          courses: courses.filter(
            (c) => matches(c.title, needle) || matches(c.description, needle),
          ),
          library: library.filter(
            // The type too, so "checklist" or "form" finds the whole shelf.
            (i) =>
              matches(i.title, needle) ||
              matches(i.category.replaceAll("_", " "), needle) ||
              matches(i.type === "EBOOK" ? "e-book ebook" : i.type, needle),
          ),
        });
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [query]);

  const total =
    results.templates.length + results.courses.length + results.library.length;

  return { results, total, isLoading, incomplete };
}
