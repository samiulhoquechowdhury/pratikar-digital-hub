"use client";

import Link from "next/link";

import { CourseCard, useCourses } from "@/features/lms";

/** How many fit one row on a wide screen without the grid going ragged. */
const MAX_SHOWN = 4;

/**
 * The course strip on the home page.
 *
 * Renders nothing at all when the catalogue is empty or unreachable. That's
 * the opposite of the /courses page, which says so out loud — here the section
 * is one of several, and an error panel on a landing page costs more trust
 * than a missing row does.
 */
export function FeaturedCourses() {
  const { courses, isLoading, error } = useCourses();

  if (error || (!isLoading && courses.length === 0)) return null;

  return (
    <section className="mx-auto max-w-shell px-4 py-16 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl">Learn something you can prove</h2>
          <p className="mt-2 max-w-prose text-base text-ink-muted">
            Video courses that end in a certificate with a code anyone can check
            — an employer, a client, or a registrar.
          </p>
        </div>
        <Link
          href="/courses"
          className="text-sm font-semibold text-primary hover:text-primary-hover"
        >
          All courses <span aria-hidden>→</span>
        </Link>
      </div>

      {isLoading ? (
        // Skeletons rather than a spinner: the row's height is known, so the
        // page doesn't jump when the data lands.
        <div
          aria-hidden
          className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {Array.from({ length: MAX_SHOWN }).map((_, index) => (
            <div
              key={index}
              className="h-64 animate-pulse rounded-card border border-line bg-surface-sunken"
            />
          ))}
        </div>
      ) : (
        <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {courses.slice(0, MAX_SHOWN).map((course) => (
            <li key={course.id}>
              <CourseCard course={course} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
