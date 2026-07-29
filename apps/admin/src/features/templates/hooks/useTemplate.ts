"use client";

import type { Template } from "@pratikar/types";
import { useEffect, useState } from "react";

import { templatesApi } from "../api/templatesApi";

/** One template of any status, for the edit screen. */
export function useTemplate(id: string | null) {
  const [template, setTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(id !== null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);

    templatesApi
      .get(id)
      .then((result) => {
        if (!cancelled) setTemplate(result);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load that template.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  return { template, isLoading, error };
}
