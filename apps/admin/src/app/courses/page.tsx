"use client";

import { ButtonLink, PageBody, PageHeader } from "@pratikar/ui";

import { CourseList } from "@/features/courses";
import { RequireStaff } from "@/shared/components/RequireStaff";

export default function Page() {
  return (
    <RequireStaff>
      <PageHeader
        title="Courses"
        description="Courses, their modules, and how long access lasts."
        actions={<ButtonLink href="/courses/new">New course</ButtonLink>}
      />
      <PageBody>
        <CourseList />
      </PageBody>
    </RequireStaff>
  );
}
