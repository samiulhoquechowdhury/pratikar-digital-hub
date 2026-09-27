import type { Course } from "@pratikar/types";

import { CatalogueCard } from "@/shared/components/CatalogueCard";

/**
 * One course, as every grid on the site shows it — the catalogue, the home
 * page and search results. A thin mapping onto CatalogueCard, so courses sit
 * in the same visual system as documents and the library.
 */
export function CourseCard({ course }: { course: Course }) {
  const lessons = course.modules?.length ?? 0;
  return (
    <CatalogueCard
      href={`/courses/${course.id}`}
      kind="course"
      title={course.title}
      description={course.description}
      meta={[
        ...(lessons > 0
          ? [`${lessons} ${lessons === 1 ? "lesson" : "lessons"}`]
          : []),
        `${course.accessDurationDays} days' access`,
        "Certificate",
      ]}
      priceInPaise={course.priceInPaise}
    />
  );
}
