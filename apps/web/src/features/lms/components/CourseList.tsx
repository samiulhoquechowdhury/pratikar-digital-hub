"use client";

import type { Course } from "@pratikar/types";
import { Alert, EmptyState, SkeletonCards } from "@pratikar/ui";

import { CatalogueGrid } from "@/shared/components/CatalogueCard";

import { useCourses } from "../hooks/useCourses";

import { CourseCard } from "./CourseCard";

export function CourseList({ initial }: { initial?: Course[] } = {}) {
  const { courses, isLoading, error } = useCourses(initial);

  if (isLoading) return <SkeletonCards label="Loading courses…" />;
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
    <CatalogueGrid>
      {courses.map((course) => (
        <li key={course.id}>
          <CourseCard course={course} />
        </li>
      ))}
    </CatalogueGrid>
  );
}
