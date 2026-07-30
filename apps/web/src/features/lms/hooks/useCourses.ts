"use client";

import type { Course } from "@pratikar/types";
import { useEffect, useState } from "react";

import { lmsApi } from "../api/lmsApi";

/** The published course catalogue. Public — no session required. */
export function useCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    lmsApi
      .list()
      .then((result) => {
        if (!cancelled) setCourses(result);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load courses.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { courses, isLoading, error };
}
