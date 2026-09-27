import { CourseDetail } from "@/features/lms";

interface CoursePageProps {
  params: Promise<{ id: string }>;
}

// CourseDetail lays out its own page (it needs the course before it knows
// its title). No <main> either — the root layout already provides one.
export default async function CoursePage({ params }: CoursePageProps) {
  const { id } = await params;

  return <CourseDetail courseId={id} />;
}
