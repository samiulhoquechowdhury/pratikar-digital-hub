"use client";

import type { Enrollment } from "@pratikar/types";
import { Badge, ButtonLink, Card, EmptyState } from "@pratikar/ui";
import { Award } from "lucide-react";
import Link from "next/link";

import { Icon } from "@/shared/components/Icon";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

/**
 * Courses the customer already owns, so every link goes to the classroom
 * rather than back to the sales page.
 *
 * Presentational — the account is loaded once by useDashboardData.
 */
export function MyCourses({ enrollments }: { enrollments: Enrollment[] }) {
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
        const percent = total > 0 ? Math.round((done / total) * 100) : 0;

        return (
          <li key={enrollment.id}>
            <Card className="group flex h-full flex-col p-6">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-base">
                  <Link
                    href={`/learn/${enrollment.id}`}
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
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm text-ink-muted">
                      {done} of {total} lessons
                    </p>
                    <p className="text-sm font-semibold tabular-nums text-ink">
                      {percent}%
                    </p>
                  </div>
                  {/*
                    The bar is decorative — the sentence above already states
                    the progress, so a screen reader announcing a second,
                    wordless progressbar would only repeat it.
                  */}
                  <div
                    aria-hidden
                    className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-sunken"
                  >
                    <div
                      className="h-full rounded-full bg-brand transition-[width] duration-500 motion-reduce:transition-none"
                      style={{ width: `${percent}%` }}
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
                  href={`/learn/${enrollment.id}/certificate`}
                  className="mt-4 inline-flex items-center gap-2 border-t border-line pt-4 text-sm font-semibold text-primary hover:text-primary-hover"
                >
                  <Icon icon={Award} /> Certificate issued — view it
                </Link>
              )}
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
