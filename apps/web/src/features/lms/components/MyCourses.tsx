"use client";

import type { Enrollment } from "@pratikar/types";
import Link from "next/link";
import { useEffect, useState } from "react";

import { useAuth } from "@/shared/providers/AuthProvider";

import { lmsApi } from "../api/lmsApi";

const formatDate = (iso: string) => new Date(iso).toLocaleDateString("en-IN");

export function MyCourses() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading] = useState(!!user);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    lmsApi
      .listMyEnrollments()
      .then((result) => {
        if (!cancelled) setEnrollments(result);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load your courses.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user) {
    return (
      <p>
        <Link href="/login">Sign in</Link> to see your courses.
      </p>
    );
  }
  if (isLoading) return <p>Loading your courses…</p>;
  if (error) return <p role="alert">{error}</p>;
  if (enrollments.length === 0) {
    return (
      <p>
        You&apos;re not enrolled in anything yet.{" "}
        <Link href="/courses">Browse courses</Link>.
      </p>
    );
  }

  return (
    <ul>
      {enrollments.map((enrollment) => {
        // An expired enrolment isn't gone — it keeps its certificate and only
        // loses playback, so it stays listed rather than disappearing.
        const expired = new Date(enrollment.expiresAt) <= new Date();
        return (
          <li key={enrollment.id}>
            <Link href={`/courses/${enrollment.courseId}`}>
              {enrollment.course.title}
            </Link>{" "}
            <small>
              {expired
                ? `access ended ${formatDate(enrollment.expiresAt)}`
                : `access until ${formatDate(enrollment.expiresAt)}`}
              {enrollment.certificate && " · certificate issued"}
            </small>
          </li>
        );
      })}
    </ul>
  );
}
