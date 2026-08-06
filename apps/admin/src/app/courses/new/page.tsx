"use client";

import { PageBody, PageHeader } from "@pratikar/ui";
import Link from "next/link";

import { CourseForm } from "@/features/courses";
import { RequireStaff } from "@/shared/components/RequireStaff";

export default function NewCoursePage() {
  return (
    <RequireStaff>
      <PageHeader
        title="New course"
        description="Add at least one module before publishing — a published course with none sells access to nothing."
        actions={
          <Link
            href="/courses"
            className="text-sm font-medium text-primary hover:text-primary-hover"
          >
            <span aria-hidden>←</span> All courses
          </Link>
        }
      />
      <PageBody>
        <CourseForm />
      </PageBody>
    </RequireStaff>
  );
}
