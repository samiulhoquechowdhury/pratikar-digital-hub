"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { CourseForm } from "@/features/courses";
import { coursesApi, type Course } from "@/features/courses/api/coursesApi";
import { RequireStaff } from "@/shared/components/RequireStaff";

function EditCourse({ id }: { id: string }) {
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    coursesApi
      .get(id)
      .then((result) => {
        if (!cancelled) setCourse(result);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load that course.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (isLoading) return <p>Loading course…</p>;
  if (error) return <p role="alert">{error}</p>;
  if (!course) return <p role="alert">Course not found.</p>;

  return (
    <>
      <h1>{course.title}</h1>
      <p>
        {course.status}
        {course.status === "PUBLISHED" && " — live in the catalogue"}
      </p>
      <CourseForm existing={course} />
    </>
  );
}

export default function EditCoursePage() {
  const params = useParams<{ id: string }>();

  return (
    <RequireStaff>
      <main>
        <p>
          <Link href="/courses">← Courses</Link>
        </p>
        <EditCourse id={params.id} />
      </main>
    </RequireStaff>
  );
}
