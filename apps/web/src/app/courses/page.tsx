import { CourseList } from "@/features/lms";
import { PageIntro, PageSection } from "@/shared/components/PageIntro";

export const metadata = { title: "Courses" };

export default function CoursesPage() {
  return (
    <>
      <PageIntro
        eyebrow="Courses"
        title="Learn it properly, prove it"
        description="Short video courses on the law you actually run into. Finish one and get a certificate with a code anyone can verify."
      />
      <PageSection className="pb-8">
        <CourseList />
      </PageSection>
    </>
  );
}
