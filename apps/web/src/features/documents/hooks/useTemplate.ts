"use client";

import type { Template } from "@pratikar/types";
import { useEffect, useState } from "react";

import { documentsApi } from "../api/documentsApi";

export function useTemplate(templateId: string, enabled = true) {
  const [template, setTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setIsLoading(true);

    documentsApi
      .getTemplate(templateId)
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
  }, [templateId, enabled]);

  return { template, isLoading, error };
}
