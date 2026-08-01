"use client";

import { Alert, Loading, PageBody, PageHeader } from "@pratikar/ui";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { QuizEditor } from "@/features/courses";
import { coursesApi, type Course } from "@/features/courses/api/coursesApi";
import { RequireStaff } from "@/shared/components/RequireStaff";

function EditQuiz({
  courseId,
  moduleId,
}: {
  courseId: string;
  moduleId: string;
}) {
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // The course is loaded for the module's title alone — a test authoring
  // screen that doesn't say which lesson it belongs to is a trap.
  useEffect(() => {
    let cancelled = false;
    coursesApi
      .get(courseId)
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
  }, [courseId]);

  if (isLoading) {
    return (
      <PageBody>
        <Loading label="Loading…" />
      </PageBody>
    );
  }

  const lesson = course?.modules?.find((m) => m.id === moduleId);
  if (error || !course || !lesson) {
    return (
      <PageBody>
        <Alert tone="danger" role="alert">
          {error ?? "That lesson isn't part of this course."}
        </Alert>
      </PageBody>
    );
  }

  return (
    <>
      <PageHeader
        title={`Test — ${lesson.title}`}
        description="Learners sit this after the lesson video, and it gates the next lesson."
        actions={
          <Link
            href={`/courses/${courseId}`}
            className="text-sm font-medium text-primary hover:text-primary-hover"
          >
            <span aria-hidden>←</span> Back to the course
          </Link>
        }
      />
      <PageBody>
        <QuizEditor
          courseId={courseId}
          moduleId={moduleId}
          moduleTitle={lesson.title}
        />
      </PageBody>
    </>
  );
}

export default function EditQuizPage() {
  const params = useParams<{ id: string; moduleId: string }>();

  return (
    <RequireStaff>
      <EditQuiz courseId={params.id} moduleId={params.moduleId} />
    </RequireStaff>
  );
}
