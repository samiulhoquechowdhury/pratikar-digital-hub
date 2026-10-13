"use client";

import type { ContentLibraryItem, Course, Template } from "@pratikar/types";
import { useEffect, useState } from "react";

import { contentLibraryApi } from "@/features/content-library/api/contentLibraryApi";
import { documentsApi } from "@/features/documents/api/documentsApi";
import { lmsApi } from "@/features/lms/api/lmsApi";
import { matchesWords, searchWithTypos } from "@/shared/catalogue";
import { COURSES_LIVE } from "@/shared/lib/features";

export interface SiteSearchResults {
  templates: Template[];
  courses: Course[];
  library: ContentLibraryItem[];
  /** Nothing matched as typed; these are the closest spellings. */
  fuzzy: boolean;
  /** The search re-spelt in the catalogue's words, for "Showing results for". */
  correction: string | null;
}

const EMPTY: SiteSearchResults = {
  templates: [],
  courses: [],
  library: [],
  fuzzy: false,
  correction: null,
};

/** What each kind is searched by. */
const templateText = (t: Template) => `${t.title} ${t.category}`;
const courseText = (c: Course) => `${c.title} ${c.description ?? ""}`;
// The type too, so "checklist" or "form" finds the whole shelf.
const libraryText = (i: ContentLibraryItem) =>
  `${i.title} ${i.category.replaceAll("_", " ")} ${
    i.type === "EBOOK" ? "e-book ebook" : i.type
  }`;

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
        // Not searched while courses are coming soon: a result would lead
        // to a page that says so.
        const searchable = COURSES_LIVE ? courses : [];

        /**
         * One search over all three catalogues together. Every word of the
         * search starts a word of the text, in any order — the catalogue
         * pages' rule, so "deed sale" finds "Sale Deed". Only when that
         * finds nothing anywhere do near spellings count, so a correctly
         * spelt search never gets noisier.
         */
        type Hit =
          | { kind: "template"; item: Template; text: string }
          | { kind: "course"; item: Course; text: string }
          | { kind: "library"; item: ContentLibraryItem; text: string };
        const everything: Hit[] = [
          ...templates.map((item) => ({
            kind: "template" as const,
            item,
            text: templateText(item),
          })),
          ...searchable.map((item) => ({
            kind: "course" as const,
            item,
            text: courseText(item),
          })),
          ...library.map((item) => ({
            kind: "library" as const,
            item,
            text: libraryText(item),
          })),
        ];
        const found = searchWithTypos(
          everything,
          needle,
          (hit) => hit.text,
          matchesWords,
        );
        setResults({
          templates: found.items.flatMap((hit) =>
            hit.kind === "template" ? [hit.item] : [],
          ),
          courses: found.items.flatMap((hit) =>
            hit.kind === "course" ? [hit.item] : [],
          ),
          library: found.items.flatMap((hit) =>
            hit.kind === "library" ? [hit.item] : [],
          ),
          fuzzy: found.fuzzy,
          correction: found.correction,
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
