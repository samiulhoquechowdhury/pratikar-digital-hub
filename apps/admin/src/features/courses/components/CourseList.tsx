"use client";

import {
  Alert,
  Badge,
  ButtonLink,
  EmptyState,
  SkeletonTable,
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

import { coursesApi, type Course, type CourseStats } from "../api/coursesApi";

/** DRAFT and ARCHIVED aren't purchasable; PUBLISHED is. Make that obvious. */
const STATUS_TONE = {
  PUBLISHED: "success",
  DRAFT: "warning",
  ARCHIVED: "neutral",
} as const;

export function CourseList() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [stats, setStats] = useState<Map<string, CourseStats>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([coursesApi.listAll(), coursesApi.stats().catch(() => [])])
      .then(([result, numbers]) => {
        if (cancelled) return;
        setCourses(result);
        setStats(new Map(numbers.map((row) => [row.courseId, row])));
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

  if (isLoading)
    return <SkeletonTable rows={6} columns={10} label="Loading courses…" />;
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
    <Table label="Courses">
      <THead>
        <TR>
          <TH>Title</TH>
          <TH>Status</TH>
          <TH align="right" secondary>
            Modules
          </TH>
          <TH align="right" secondary>
            Enrolled
          </TH>
          <TH align="right" secondary>
            Completed
          </TH>
          <TH align="right" secondary>
            Certificates
          </TH>
          <TH align="right" secondary>
            Revenue
          </TH>
          <TH align="right" secondary>
            Access
          </TH>
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
              <TD secondary align="right" muted>
                {modules}
              </TD>
              <TD secondary align="right" muted>
                {stats.get(course.id)?.enrollments ??
                  course._count?.enrollments ??
                  0}
                {(stats.get(course.id)?.active ?? 0) > 0 && (
                  <span className="block text-xs text-ink-subtle">
                    {stats.get(course.id)!.active} active
                  </span>
                )}
              </TD>
              <TD secondary align="right" muted>
                {stats.get(course.id)?.completed ?? 0}
              </TD>
              <TD secondary align="right" muted>
                {stats.get(course.id)?.certificates ?? 0}
              </TD>
              <TD secondary align="right" muted>
                ₹{paiseToRupees(stats.get(course.id)?.revenuePaise ?? 0)}
              </TD>
              <TD secondary align="right" muted>
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
