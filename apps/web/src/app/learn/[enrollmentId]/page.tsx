import { PageBody } from "@pratikar/ui";
import type { Metadata } from "next";

import { LessonPlayer } from "@/features/lms";

export const metadata: Metadata = { title: "Your course" };

export default async function LearnPage({
  params,
}: {
  params: Promise<{ enrollmentId: string }>;
}) {
  const { enrollmentId } = await params;

  return (
    <PageBody>
      <LessonPlayer enrollmentId={enrollmentId} />
    </PageBody>
  );
}
