"use client";

import type { Course, Enrollment } from "@pratikar/types";
import { useCallback, useEffect, useState } from "react";

import { lmsApi } from "../api/lmsApi";

/**
 * A course plus the signed-in user's enrolment in it, if any.
 *
 * Access has two halves, and the UI needs to tell them apart: an expired
 * enrolment still exists and still keeps its certificate, but no longer grants
 * video access (docs/srs.md Section 7, item 2). "Enrolled" and "can watch" are
 * therefore separate answers.
 */
export function useCourse(courseId: string, hasSession: boolean) {
  const [course, setCourse] = useState<Course | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEnrollment = useCallback(async () => {
    if (!hasSession) return null;
    const mine = await lmsApi.listMyEnrollments();
    return mine.find((e) => e.courseId === courseId) ?? null;
  }, [courseId, hasSession]);

  useEffect(() => {
    let cancelled = false;

    Promise.all([lmsApi.get(courseId), loadEnrollment()])
      .then(([fetchedCourse, fetchedEnrollment]) => {
        if (cancelled) return;
        setCourse(fetchedCourse);
        setEnrollment(fetchedEnrollment);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load this course.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [courseId, loadEnrollment]);

  const refreshEnrollment = useCallback(() => {
    void loadEnrollment().then(setEnrollment);
  }, [loadEnrollment]);

  const hasVideoAccess =
    !!enrollment && new Date(enrollment.expiresAt) > new Date();

  return {
    course,
    enrollment,
    hasVideoAccess,
    isLoading,
    error,
    refreshEnrollment,
  };
}
