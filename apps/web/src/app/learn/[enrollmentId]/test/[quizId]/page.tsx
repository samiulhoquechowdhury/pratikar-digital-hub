import { PageBody } from "@pratikar/ui";
import type { Metadata } from "next";

import { QuizRunner } from "@/features/lms";

export const metadata: Metadata = { title: "Lesson test" };

// No PageHeader: a timed test gets the screen to itself, and the countdown in
// QuizRunner is the only thing that should be pinned to the top.
export default async function QuizPage({
  params,
}: {
  params: Promise<{ enrollmentId: string; quizId: string }>;
}) {
  const { enrollmentId, quizId } = await params;

  return (
    <PageBody>
      <QuizRunner quizId={quizId} enrollmentId={enrollmentId} />
    </PageBody>
  );
}
