"use client";

import { Alert, Badge, Loading, PageBody, PageHeader } from "@pratikar/ui";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { CourseForm } from "@/features/courses";
import { coursesApi, type Course } from "@/features/courses/api/coursesApi";
import { RequireStaff } from "@/shared/components/RequireStaff";

const STATUS_TONE = {
  PUBLISHED: "success",
  DRAFT: "warning",
  ARCHIVED: "neutral",
} as const;

const BackLink = () => (
  <Link
    href="/courses"
    className="text-sm font-medium text-primary hover:text-primary-hover"
  >
    <span aria-hidden>←</span> All courses
  </Link>
);

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

  if (isLoading) {
    return (
      <PageBody>
        <Loading label="Loading course…" />
      </PageBody>
    );
  }

  if (error || !course) {
    return (
      <PageBody>
        <Alert tone="danger" role="alert">
          {error ?? "Course not found."}
        </Alert>
      </PageBody>
    );
  }

  return (
    <>
      <PageHeader title={course.title} actions={<BackLink />} />
      <PageBody className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone={STATUS_TONE[course.status]}>{course.status}</Badge>
          {course.status === "PUBLISHED" && (
            <span className="text-sm text-ink-muted">
              Live in the catalogue. Changing access duration affects new
              enrolments only.
            </span>
          )}
        </div>

        <CourseForm existing={course} />
      </PageBody>
    </>
  );
}

export default function EditCoursePage() {
  const params = useParams<{ id: string }>();

  return (
    <RequireStaff>
      <EditCourse id={params.id} />
    </RequireStaff>
  );
}
