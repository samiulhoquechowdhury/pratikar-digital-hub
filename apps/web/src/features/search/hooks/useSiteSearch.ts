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
 * Of the three catalogues, only /courses is public. Templates and the library
 * sit behind JwtAuthGuard, so signed-out visitors get course results and a
 * note explaining what they're not seeing — hence `restricted` rather than a
 * blanket error.
 */
export function useSiteSearch(query: string) {
  const [results, setResults] = useState<SiteSearchResults>(EMPTY);
  const [isLoading, setIsLoading] = useState(true);
  const [restricted, setRestricted] = useState(false);

  useEffect(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      setResults(EMPTY);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    // A failure in one catalogue must not blank the other two — a 401 on
    // templates is the normal signed-out case, not an outage.
    const failed = { templates: false, library: false };
    const settle = <T>(promise: Promise<T[]>, mark?: () => void) =>
      promise.catch(() => {
        mark?.();
        return [] as T[];
      });

    // `void`: every branch is already settled by `settle` above, so there is
    // no rejection left for a handler to catch.
    void Promise.all([
      settle(documentsApi.listTemplates(), () => (failed.templates = true)),
      settle(lmsApi.list()),
      settle(contentLibraryApi.list(), () => (failed.library = true)),
    ])
      .then(([templates, courses, library]) => {
        if (cancelled) return;

        setRestricted(failed.templates && failed.library);
        setResults({
          templates: templates.filter(
            (t) => matches(t.title, needle) || matches(t.category, needle),
          ),
          courses: courses.filter(
            (c) => matches(c.title, needle) || matches(c.description, needle),
          ),
          library: library.filter(
            (i) => matches(i.title, needle) || matches(i.category, needle),
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

  return { results, total, isLoading, restricted };
}
