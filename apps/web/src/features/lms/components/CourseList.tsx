"use client";

import { Alert, EmptyState, Loading } from "@pratikar/ui";

import { useCourses } from "../hooks/useCourses";

import { CourseCard } from "./CourseCard";

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
          <CourseCard course={course} />
        </li>
      ))}
    </ul>
  );
}
