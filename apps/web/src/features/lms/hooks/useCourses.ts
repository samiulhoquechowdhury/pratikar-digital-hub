"use client";

import type { Course } from "@pratikar/types";

import { useCatalogueData } from "@/shared/hooks/useCatalogueData";

import { lmsApi } from "../api/lmsApi";

/** The published course catalogue. Public — no session required. */
export function useCourses(initial?: Course[]) {
  const { data, isLoading, error } = useCatalogueData(
    "courses",
    lmsApi.list,
    "Couldn't load courses.",
    initial,
  );
  return { courses: data ?? [], isLoading, error };
}
