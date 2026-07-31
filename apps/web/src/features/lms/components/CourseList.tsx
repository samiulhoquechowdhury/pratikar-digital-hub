"use client";

import { Alert, Card, EmptyState, Loading } from "@pratikar/ui";
import { formatPaise } from "@pratikar/utils";
import Link from "next/link";

import { useCourses } from "../hooks/useCourses";

export function CourseList() {
  const { courses, isLoading, error } = useCourses();

  if (isLoading) return <Loading label="Loading courses…" />;
  if (error)
    return (
      <Alert tone="danger" role="alert">
        {error}
      </Alert>
    );
  if (courses.length === 0) {
    return (
      <EmptyState
        title="No courses published yet"
        description="New courses appear here as they're released."
      />
    );
  }

  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => (
        <li key={course.id}>
          <Card className="flex h-full flex-col p-6">
            <h2 className="text-lg">
              {/* Whole card is the target, but only the title is the link —
                  keeps the accessible name short and the markup honest. */}
              <Link
                href={`/courses/${course.id}`}
                className="text-ink hover:text-brand"
              >
                {course.title}
              </Link>
            </h2>

            {course.description && (
              <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">
                {course.description}
              </p>
            )}

            <div className="mt-5 flex items-baseline justify-between border-t border-line pt-4">
              <span className="text-lg font-semibold text-ink">
                {formatPaise(course.priceInPaise)}
              </span>
              <span className="text-xs text-ink-subtle">
                {course.accessDurationDays} days&apos; access
              </span>
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );
}
