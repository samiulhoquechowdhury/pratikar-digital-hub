"use client";

import Link from "next/link";

import { CourseForm } from "@/features/courses";
import { RequireStaff } from "@/shared/components/RequireStaff";

export default function NewCoursePage() {
  return (
    <RequireStaff>
      <main>
        <p>
          <Link href="/courses">← Courses</Link>
        </p>
        <h1>New course</h1>
        <CourseForm />
      </main>
    </RequireStaff>
  );
}
