import type { Metadata } from "next";
import { Suspense } from "react";

import { SearchResults } from "@/features/search";
import { PageIntro, PageSection } from "@/shared/components/PageIntro";

export const metadata: Metadata = { title: "Search" };

export default function SearchPage() {
  return (
    <>
      <PageIntro
        eyebrow="Search"
        title="Find what you need"
        description="Document templates, courses, e-books, checklists and forms — the whole catalogue in one search."
      />
      <PageSection className="pb-8">
        {/* SearchResults reads ?q= through useSearchParams, which Next requires
            to sit inside a Suspense boundary. */}
        <Suspense fallback={null}>
          <SearchResults />
        </Suspense>
      </PageSection>
    </>
  );
}
