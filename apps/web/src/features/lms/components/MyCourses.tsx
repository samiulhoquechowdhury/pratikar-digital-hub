"use client";

import type { Enrollment } from "@pratikar/types";
import {
  Alert,
  Badge,
  ButtonLink,
  Card,
  EmptyState,
  Loading,
} from "@pratikar/ui";
import Link from "next/link";
import { useEffect, useState } from "react";

import { useAuth } from "@/shared/providers/AuthProvider";

import { lmsApi } from "../api/lmsApi";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

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
      <EmptyState
        title="Sign in to see your courses"
        action={<ButtonLink href="/login?next=/dashboard">Sign in</ButtonLink>}
      />
    );
  }
  if (isLoading) return <Loading label="Loading your courses…" />;
  if (error) {
    return (
      <Alert tone="danger" role="alert">
        {error}
      </Alert>
    );
  }
  if (enrollments.length === 0) {
    return (
      <EmptyState
        title="You're not enrolled in anything yet"
        description="Courses end in a certificate with a code anyone can verify."
        action={<ButtonLink href="/courses">Browse courses</ButtonLink>}
      />
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {enrollments.map((enrollment) => {
        // An expired enrolment isn't gone — it keeps its certificate and only
        // loses playback, so it stays listed rather than disappearing.
        const expired = new Date(enrollment.expiresAt) <= new Date();
        const done = enrollment.progress?.length ?? 0;
        const total = enrollment.course._count?.modules ?? 0;

        return (
          <li key={enrollment.id}>
            <Card className="group flex h-full flex-col p-6">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-base">
                  <Link
                    href={`/courses/${enrollment.courseId}`}
                    className="text-ink transition-colors group-hover:text-primary"
                  >
                    {enrollment.course.title}
                  </Link>
                </h3>
                <Badge tone={expired ? "neutral" : "success"}>
                  {expired ? "Access ended" : "Active"}
                </Badge>
              </div>

              {total > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-ink-muted">
                    {done} of {total} lessons completed
                  </p>
                  <div
                    aria-hidden
                    className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-sunken"
                  >
                    <div
                      className="h-full rounded-full bg-brand"
                      style={{ width: `${(done / total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              <p className="mt-4 flex-1 text-sm text-ink-subtle">
                {expired
                  ? `Access ended ${formatDate(enrollment.expiresAt)}`
                  : `Access until ${formatDate(enrollment.expiresAt)}`}
              </p>

              {enrollment.certificate && (
                <Link
                  href={`/verify/${enrollment.certificate.verificationCode}`}
                  className="mt-4 inline-block border-t border-line pt-4 text-sm font-semibold text-primary hover:text-primary-hover"
                >
                  Certificate issued — view it
                </Link>
              )}
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
