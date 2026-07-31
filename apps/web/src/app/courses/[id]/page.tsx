import { CourseDetail } from "@/features/lms";

interface CoursePageProps {
  params: Promise<{ id: string }>;
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { id } = await params;

  return (
    <main>
      <CourseDetail courseId={id} />
    </main>
  );
}
