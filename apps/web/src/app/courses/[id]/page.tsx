import type { Course } from "@pratikar/types";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CourseDetail, CoursesComingSoon } from "@/features/lms";
import { JsonLd } from "@/shared/components/JsonLd";
import { COURSES_LIVE } from "@/shared/lib/features";
import {
  courseDescription,
  productMetadata,
  courseJsonLd,
} from "@/shared/lib/seo";
import { dataOf, serverGet } from "@/shared/lib/serverApi";

interface CoursePageProps {
  params: Promise<{ id: string }>;
}

const load = (id: string) =>
  serverGet<Course>(`/courses/catalogue/${encodeURIComponent(id)}`);

export async function generateMetadata({
  params,
}: CoursePageProps): Promise<Metadata> {
  if (!COURSES_LIVE) return { title: "Courses — coming soon" };
  const { id } = await params;
  const course = dataOf(await load(id));
  if (!course) return { title: "Course" };

  return productMetadata({
    title: course.title,
    description: courseDescription(course),
    path: `/courses/${id}`,
  });
}

// Rendered on the server so the syllabus and price are in the HTML; the
// visitor's own enrolment is still fetched in the browser. No <main>: the
// root layout already provides one.
export default async function CoursePage({ params }: CoursePageProps) {
  // Not on sale yet: no price, no buy button, nothing to enrol in.
  if (!COURSES_LIVE) return <CoursesComingSoon />;
  const { id } = await params;
  const result = await load(id);
  if (result.status === "missing") notFound();
  const course = dataOf(result);

  return (
    <>
      {course && <JsonLd data={courseJsonLd(course)} />}
      <CourseDetail courseId={id} initialCourse={course} />
    </>
  );
}
