"use client";

import type { Template } from "@pratikar/types";

import { useCatalogueData } from "@/shared/hooks/useCatalogueData";

import { documentsApi } from "../api/documentsApi";

/** The published template catalogue. Public — no session required. */
export function useTemplates(initial?: Template[]) {
  const { data, isLoading, error } = useCatalogueData(
    "templates",
    documentsApi.listTemplates,
    "Couldn't load templates.",
    initial,
  );
  return { templates: data ?? [], isLoading, error };
}
