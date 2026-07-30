"use client";

import { formatPaise } from "@pratikar/utils";
import Link from "next/link";

import { useCourses } from "../hooks/useCourses";

export function CourseList() {
  const { courses, isLoading, error } = useCourses();

  if (isLoading) return <p>Loading courses…</p>;
  if (error) return <p role="alert">{error}</p>;
  if (courses.length === 0) return <p>No courses published yet.</p>;

  return (
    <ul>
      {courses.map((course) => (
        <li key={course.id}>
          <Link href={`/courses/${course.id}`}>{course.title}</Link>{" "}
          <small>
            {formatPaise(course.priceInPaise)} · {course.accessDurationDays}{" "}
            days&apos; access
          </small>
          {course.description && <p>{course.description}</p>}
        </li>
      ))}
    </ul>
  );
}
