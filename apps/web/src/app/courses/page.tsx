import type { Course } from "@pratikar/types";
import type { Metadata } from "next";

import { CourseList } from "@/features/lms";
import { PageIntro, PageSection } from "@/shared/components/PageIntro";
import { dataOf, serverGet } from "@/shared/lib/serverApi";

export const metadata: Metadata = {
  title: "Legal and compliance courses",
  description:
    "Short video courses on GST, property and running a business in India, each with a certificate anyone can verify.",
  alternates: { canonical: "/courses" },
};

export default async function CoursesPage() {
  const courses = dataOf(await serverGet<Course[]>("/courses"));
  return (
    <>
      <PageIntro
        eyebrow="Courses"
        title="Learn it properly, prove it"
        description="Short video courses on the law you actually run into. Finish one and get a certificate with a code anyone can verify."
      />
      <PageSection className="pb-8">
        <CourseList initial={courses} />
      </PageSection>
    </>
  );
}
