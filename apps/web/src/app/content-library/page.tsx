import { SkeletonCards } from "@pratikar/ui";
import { Suspense } from "react";

import { ContentLibraryList } from "@/features/content-library";
import { PageIntro, PageSection } from "@/shared/components/PageIntro";

export const metadata = { title: "Library" };

export default function ContentLibraryPage() {
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
          <ContentLibraryList />
        </Suspense>
      </PageSection>
    </>
  );
}
