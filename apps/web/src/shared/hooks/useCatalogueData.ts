"use client";

import { useEffect, useState } from "react";

/**
 * Catalogue data that may already have come from the server.
 *
 * Pages that render on the server hand over what they fetched as `initial`;
 * the browser then starts with it, shows no loading state, and doesn't ask
 * again. Without it — the API was down during render, or the component is
 * used somewhere that doesn't render on the server — it fetches as before.
 *
 * `key` identifies what is being loaded (an id, or a constant for a list),
 * so the loader runs again when it changes and not on every render.
 */
export function useCatalogueData<T>(
  key: string,
  load: () => Promise<T>,
  errorMessage: string,
  initial?: T,
) {
  const [data, setData] = useState<T | undefined>(initial);
  const [isLoading, setIsLoading] = useState(initial === undefined);
  const [error, setError] = useState<string | null>(null);
  const hasInitial = initial !== undefined;

  useEffect(() => {
    if (hasInitial) return;
    let cancelled = false;
    setIsLoading(true);
    load()
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) setError(errorMessage);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // `load` is a fresh closure every render; `key` is what identifies it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, hasInitial]);

  return { data, isLoading, error };
}
