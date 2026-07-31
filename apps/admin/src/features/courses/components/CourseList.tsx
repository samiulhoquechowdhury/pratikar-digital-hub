"use client";

import {
  Alert,
  Badge,
  ButtonLink,
  EmptyState,
  Loading,
  TBody,
  TD,
  TH,
  THead,
  TR,
  Table,
} from "@pratikar/ui";
import Link from "next/link";
import { useEffect, useState } from "react";

import { paiseToRupees } from "@/features/templates/lib/fieldSchema";

import { coursesApi, type Course } from "../api/coursesApi";

/** DRAFT and ARCHIVED aren't purchasable; PUBLISHED is. Make that obvious. */
const STATUS_TONE = {
  PUBLISHED: "success",
  DRAFT: "warning",
  ARCHIVED: "neutral",
} as const;

export function CourseList() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    coursesApi
      .listAll()
      .then((result) => {
        if (!cancelled) setCourses(result);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load courses.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) return <Loading label="Loading courses…" />;
  if (error) {
    return (
      <Alert tone="danger" role="alert">
        {error}
      </Alert>
    );
  }

  if (courses.length === 0) {
    return (
      <EmptyState
        title="No courses yet"
        description="A course is a set of video modules that ends in a verifiable certificate."
        action={<ButtonLink href="/courses/new">Create a course</ButtonLink>}
      />
    );
  }

  return (
    <Table>
      <THead>
        <TR>
          <TH>Title</TH>
          <TH>Status</TH>
          <TH align="right">Modules</TH>
          <TH align="right">Enrolled</TH>
          <TH align="right">Access</TH>
          <TH align="right">Price</TH>
          <TH align="right">
            <span className="sr-only">Actions</span>
          </TH>
        </TR>
      </THead>
      <TBody>
        {courses.map((course) => {
          const modules = course._count?.modules ?? 0;
          return (
            <TR key={course.id}>
              <TD>
                <Link
                  href={`/courses/${course.id}`}
                  className="font-medium text-ink hover:text-primary"
                >
                  {course.title}
                </Link>
                {/* A published course with no modules sells access to
                    nothing. The form blocks creating one, but a course can
                    reach this state by having its modules removed later. */}
                {course.status === "PUBLISHED" && modules === 0 && (
                  <span className="mt-1 block text-xs font-medium text-danger-text">
                    Published with no modules
                  </span>
                )}
              </TD>
              <TD>
                <Badge tone={STATUS_TONE[course.status]}>{course.status}</Badge>
              </TD>
              <TD align="right" muted>
                {modules}
              </TD>
              <TD align="right" muted>
                {course._count?.enrollments ?? 0}
              </TD>
              <TD align="right" muted>
                {course.accessDurationDays}d
              </TD>
              <TD align="right">₹{paiseToRupees(course.priceInPaise)}</TD>
              <TD align="right">
                <Link
                  href={`/courses/${course.id}`}
                  className="text-sm font-semibold text-primary hover:text-primary-hover"
                >
                  Edit
                </Link>
              </TD>
            </TR>
          );
        })}
      </TBody>
    </Table>
  );
}
