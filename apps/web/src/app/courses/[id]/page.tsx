import { CourseDetail } from "@/features/lms";

interface CoursePageProps {
  params: Promise<{ id: string }>;
}

// CourseDetail owns its own full-bleed header, so there's no PageHeader or
// PageBody here. No <main> either — the root layout already provides one.
export default async function CoursePage({ params }: CoursePageProps) {
  const { id } = await params;

  return <CourseDetail courseId={id} />;
}
