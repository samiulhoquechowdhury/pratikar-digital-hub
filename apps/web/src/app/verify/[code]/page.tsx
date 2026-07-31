import { PageBody } from "@pratikar/ui";
import type { Metadata } from "next";

import { CertificateVerifier } from "@/features/lms";

export const metadata: Metadata = {
  title: "Verify a certificate",
  // Verification pages are per-certificate and hold someone's name; there is
  // nothing for a search engine to usefully index and a reason not to.
  robots: { index: false, follow: false },
};

interface VerifyPageProps {
  params: Promise<{ code: string }>;
}

export default async function VerifyPage({ params }: VerifyPageProps) {
  const { code } = await params;

  return (
    <PageBody className="max-w-3xl">
      <CertificateVerifier code={code} />
    </PageBody>
  );
}
