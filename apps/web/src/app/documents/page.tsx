import type { Template } from "@pratikar/types";
import type { Metadata } from "next";

import { TemplateList } from "@/features/documents";
import { PageIntro, PageSection } from "@/shared/components/PageIntro";
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
      <PageIntro
        eyebrow="Documents"
        title="Legal documents, ready to sign"
        description="Answer a few plain-language questions and get a finished document as a Word file and a PDF. Add a lawyer's review if you'd like a second pair of eyes."
      />
      <PageSection className="pb-8">
        <TemplateList initial={templates} />
      </PageSection>
    </>
  );
}
