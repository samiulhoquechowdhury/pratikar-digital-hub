import { CourseList } from "@/features/lms";
import { PageBody, PageHeader } from "@/shared/components/ui";

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
