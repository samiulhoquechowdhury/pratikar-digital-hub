import type { Template } from "@pratikar/types";
import { SkeletonCards } from "@pratikar/ui";
import type { Metadata } from "next";
import { Suspense } from "react";

import { TemplateList } from "@/features/documents";
import { CatalogueHeader } from "@/shared/catalogue";
import { PageSection } from "@/shared/components/PageIntro";
import { dataOf, serverGet } from "@/shared/lib/serverApi";

export const metadata: Metadata = {
  title: "Legal document templates",
  description:
    "Rent agreements, offer letters, NDAs and more. Answer a few plain-language questions and download a ready-to-sign Word and PDF document.",
  alternates: { canonical: "/documents" },
};

// No <main> here: the root layout already provides one, and nesting a second
// is invalid — screen readers announce two "main" landmarks and the skip link
// stops meaning anything.
export default async function DocumentsPage() {
  // Rendered on the server so the catalogue is in the HTML; if the API can't
  // be reached, the list loads in the browser instead.
  const templates = dataOf(await serverGet<Template[]>("/documents/templates"));
  return (
    <>
      <CatalogueHeader
        eyebrow="Document generator"
        title="Legal documents, ready to sign"
        description="Answer a few plain-language questions and get a finished document as a Word file and a PDF — with a lawyer's review if you'd like one."
        basePath="/documents"
        popular={["Rent agreement", "Offer letter"]}
      />
      <PageSection className="pb-12">
        {/* Filters live in the URL, which Next only reads inside Suspense
            on a statically rendered page. */}
        <Suspense
          fallback={<SkeletonCards media={false} label="Loading templates…" />}
        >
          <TemplateList initial={templates} />
        </Suspense>
      </PageSection>
    </>
  );
}
