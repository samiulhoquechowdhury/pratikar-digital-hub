import { CourseList } from "@/features/lms";

export default function CoursesPage() {
  return (
    <main>
      <h1>Courses</h1>
      <p>Video courses with a certificate on completion.</p>
      <CourseList />
    </main>
  );
}
