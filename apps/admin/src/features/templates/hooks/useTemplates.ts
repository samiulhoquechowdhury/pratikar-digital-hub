"use client";

import type { Template } from "@pratikar/types";
import { useCallback, useEffect, useState } from "react";

import { templatesApi } from "../api/templatesApi";

/** All templates, every status — the admin list view. */
export function useTemplates(enabled = true) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    setIsLoading(true);

    templatesApi
      .listAll()
      .then((result) => {
        if (!cancelled) {
          setTemplates(result);
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load templates.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  useEffect(() => load(), [load]);

  return { templates, isLoading, error, reload: load };
}
