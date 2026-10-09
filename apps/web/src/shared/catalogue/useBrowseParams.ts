"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

export type BrowseView = "list" | "grid";

export interface BrowseParams {
  q: string;
  filters: Record<string, string>;
  sort: string;
  page: number;
  view: BrowseView;
}

/**
 * The catalogue's state, kept in the address bar: search, every filter,
 * sort, page and view. So Back undoes a filter, a refresh keeps it, and a
 * link someone shares opens exactly what they were looking at.
 *
 * Filter parameters are the facet ids, which keeps links that already exist
 * working — /content-library?shelf=forms, ?category=property-documentation.
 * Defaults are left out of the URL, so the plain page stays a plain link.
 */
export function useBrowseParams(
  facetIds: string[],
  defaults: { sort: string; view: BrowseView },
) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const params = useMemo<BrowseParams>(() => {
    const filters: Record<string, string> = {};
    for (const id of facetIds) {
      const value = searchParams.get(id);
      if (value) filters[id] = value;
    }
    const page = Number.parseInt(searchParams.get("page") ?? "1", 10);
    const view = searchParams.get("view");
    return {
      q: searchParams.get("q") ?? "",
      filters,
      sort: searchParams.get("sort") ?? defaults.sort,
      page: Number.isFinite(page) && page > 0 ? page : 1,
      view: view === "grid" || view === "list" ? view : defaults.view,
    };
  }, [searchParams, facetIds, defaults.sort, defaults.view]);

  /**
   * Applies a change. Anything that changes the results — search, filters,
   * sort — goes back to page 1, so nobody is left on page 9 of 2.
   *
   * A filter, sort or page is a step Back should undo, so it's pushed onto
   * history; typing in the search box replaces, or Back would replay every
   * keystroke.
   */
  const update = useCallback(
    (change: Partial<BrowseParams>, history: "push" | "replace" = "push") => {
      const next = { ...params, ...change };
      if (
        change.q !== undefined ||
        change.filters !== undefined ||
        change.sort !== undefined
      ) {
        next.page = change.page ?? 1;
      }

      const query = new URLSearchParams();
      if (next.q.trim()) query.set("q", next.q.trim());
      for (const [id, value] of Object.entries(next.filters)) {
        if (value) query.set(id, value);
      }
      if (next.sort !== defaults.sort) query.set("sort", next.sort);
      if (next.view !== defaults.view) query.set("view", next.view);
      if (next.page > 1) query.set("page", String(next.page));

      const search = query.toString();
      const href = search ? `${pathname}?${search}` : pathname;
      if (history === "push") router.push(href, { scroll: false });
      else router.replace(href, { scroll: false });
    },
    [params, pathname, router, defaults.sort, defaults.view],
  );

  return { params, update };
}
