import type { ContentLibraryItem } from "@pratikar/types";
import { SkeletonCards } from "@pratikar/ui";
import type { Metadata } from "next";
import { Suspense } from "react";

import { ContentLibraryList } from "@/features/content-library";
import { PageIntro, PageSection } from "@/shared/components/PageIntro";
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
      <PageIntro
        eyebrow="Library"
        title="Guides, checklists and forms"
        description="Buy once, download whenever you need it. E-books that explain, checklists that keep you on track, and forms you fill in yourself."
      />
      <PageSection className="pb-8">
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
