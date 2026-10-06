import type { ContentLibraryItem } from "@pratikar/types";
import { SkeletonCards } from "@pratikar/ui";
import type { Metadata } from "next";
import { Suspense } from "react";

import { ContentLibraryList } from "@/features/content-library";
import { CatalogueHeader } from "@/shared/catalogue";
import { PageSection } from "@/shared/components/PageIntro";
import { dataOf, serverGet } from "@/shared/lib/serverApi";

export const metadata: Metadata = {
  title: "Legal e-books, checklists and forms",
  description:
    "Guides, checklists and fill-in forms for property, business compliance and more. Buy once and download whenever you need them.",
  alternates: { canonical: "/content-library" },
};

export default async function ContentLibraryPage() {
  const items = dataOf(
    await serverGet<ContentLibraryItem[]>("/content-library"),
  );
  return (
    <>
      <CatalogueHeader
        eyebrow="Library"
        title="Forms, checklists and e-books"
        description="Ready-to-use legal forms, checklists for before you sign or file, and plain-language e-books. Buy once, download whenever you need it."
        basePath="/content-library"
        popular={[
          "Affidavit",
          "Legal notice",
          "Bail",
          "GST",
          "Divorce",
          "Lease",
        ]}
      />
      <PageSection className="pb-12 pt-6">
        {/* The shelf is read from the URL, which Next only allows inside a
            Suspense boundary on a statically rendered page. */}
        <Suspense
          fallback={
            <SkeletonCards media={false} label="Loading the library…" />
          }
        >
          <ContentLibraryList initial={items} />
        </Suspense>
      </PageSection>
    </>
  );
}
