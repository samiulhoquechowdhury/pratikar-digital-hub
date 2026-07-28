"use client";

import type { Template } from "@pratikar/types";
import { useEffect, useState } from "react";

import { documentsApi } from "../api/documentsApi";

export function useTemplates(enabled = true) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    documentsApi
      .listTemplates()
      .then((result) => {
        if (!cancelled) setTemplates(result);
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

  return { templates, isLoading, error };
}
