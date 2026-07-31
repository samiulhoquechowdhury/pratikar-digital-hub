import { PageBody, PageHeader } from "@pratikar/ui";

import { CourseList } from "@/features/lms";

export const metadata = { title: "Courses" };

export default function CoursesPage() {
  return (
    <>
      <PageHeader
        title="Courses"
        description="Video courses with a certificate on completion. Access runs for a fixed period from the day you enrol."
      />
      <PageBody>
        <CourseList />
      </PageBody>
    </>
  );
}
