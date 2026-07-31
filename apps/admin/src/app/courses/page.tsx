"use client";

import Link from "next/link";

import { CourseList } from "@/features/courses";
import { RequireStaff } from "@/shared/components/RequireStaff";

export default function CoursesPage() {
  return (
    <RequireStaff>
      <main>
        <p>
          <Link href="/">← Admin home</Link>
        </p>
        <h1>Courses</h1>
        <CourseList />
      </main>
    </RequireStaff>
  );
}
