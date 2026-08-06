import { PageBody } from "@pratikar/ui";
import type { Metadata } from "next";

import { CertificateView } from "@/features/lms";

export const metadata: Metadata = { title: "Your certificate" };

export default async function CertificatePage({
  params,
}: {
  params: Promise<{ enrollmentId: string }>;
}) {
  const { enrollmentId } = await params;

  return (
    <PageBody>
      <CertificateView enrollmentId={enrollmentId} />
    </PageBody>
  );
}
