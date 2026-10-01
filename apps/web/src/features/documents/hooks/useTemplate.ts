"use client";

import type { Template } from "@pratikar/types";

import { useCatalogueData } from "@/shared/hooks/useCatalogueData";

import { documentsApi } from "../api/documentsApi";

/** One published template; `initial` is what the page fetched on the server. */
export function useTemplate(templateId: string, initial?: Template) {
  const { data, isLoading, error } = useCatalogueData(
    templateId,
    () => documentsApi.getTemplate(templateId),
    "Couldn't load that template.",
    initial,
  );
  return { template: data ?? null, isLoading, error };
}
