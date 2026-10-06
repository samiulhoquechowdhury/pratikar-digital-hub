import { Skeleton } from "@pratikar/ui";
import type { Metadata } from "next";
import { Suspense } from "react";

import { CustomDraftForm } from "@/features/documents";
import { PageIntro, PageSection } from "@/shared/components/PageIntro";

export const metadata: Metadata = {
  title: "Draft any legal document with AI",
  description:
    "Describe the document you need and our AI drafts it in about a minute. A practising advocate reviews it before you download — Word and PDF.",
  alternates: { canonical: "/documents/custom" },
};

export default function CustomDraftPage() {
  return (
    <>
      <PageIntro
        eyebrow="AI drafting · advocate reviewed"
        title="Any legal document, drafted for you"
        description="Can't find a template? Describe what you need in plain language. Our AI drafts it, an advocate reviews it, and you download it."
      />
      <PageSection className="pb-12">
        {/* Reads ?type= from the assistant's "Draft it with AI" link. */}
        <Suspense fallback={<Skeleton className="h-[36rem] w-full" />}>
          <CustomDraftForm />
        </Suspense>
      </PageSection>
    </>
  );
}
