import type { Template } from "@pratikar/types";
import { SkeletonCards } from "@pratikar/ui";
import { FilePenLine } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { TemplateList } from "@/features/documents";
import { CatalogueHeader } from "@/shared/catalogue";
import { Icon } from "@/shared/components/Icon";
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
        description="Answer a few plain-language questions and get a finished document as a Word file and a PDF — with an advocate's review if you'd like one."
        basePath="/documents"
        popular={["Rent agreement", "Offer letter"]}
      />
      <PageSection className="mb-6">
        {/* The templates are the quick route, not the limit. */}
        <Link
          href="/documents/custom"
          className="group flex flex-col gap-4 rounded-card bg-surface-inverse px-5 py-5 text-ink-inverse shadow-card transition-transform hover:-translate-y-0.5 motion-reduce:transform-none sm:flex-row sm:items-center sm:px-6"
        >
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand text-on-brand">
            <Icon icon={FilePenLine} size="md" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-base font-semibold">
              Need a document that isn&apos;t here?
            </span>
            <span className="mt-0.5 block text-sm text-ink-inverse-muted">
              Describe it and our AI drafts it in about a minute — then a
              practising advocate reviews it before you download.
            </span>
          </span>
          <span className="whitespace-nowrap rounded-control bg-brand px-4 py-2 text-sm font-semibold text-on-brand transition-colors group-hover:bg-brand-hover">
            Draft it with AI
          </span>
        </Link>
      </PageSection>
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
