"use client";

import type { CourseOutline } from "@pratikar/types";
import { useCallback, useEffect, useState } from "react";

import { lmsApi } from "../api/lmsApi";

/**
 * The gated lesson plan for one enrolment.
 *
 * Refetched rather than patched locally after each step, because unlocking is
 * a server decision: finishing a video can open a test, and submitting a test
 * can open the next lesson or issue a certificate. Recomputing that in the
 * browser would mean two implementations of the same rules, and the browser's
 * would be the one that's wrong.
 */
export function useCourseOutline(enrollmentId: string) {
  const [outline, setOutline] = useState<CourseOutline | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setOutline(await lmsApi.getOutline(enrollmentId));
      setError(null);
    } catch {
      setError("Couldn't load this course.");
    } finally {
      setIsLoading(false);
    }
  }, [enrollmentId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { outline, isLoading, error, reload: load };
}
