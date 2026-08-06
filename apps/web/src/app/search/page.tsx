import { PageBody, PageHeader } from "@pratikar/ui";
import type { Metadata } from "next";
import { Suspense } from "react";

import { SearchResults } from "@/features/search";

export const metadata: Metadata = { title: "Search" };

export default function SearchPage() {
  return (
    <>
      <PageHeader
        title="Search"
        description="Document templates, courses, and guides across the whole catalogue."
      />
      <PageBody>
        {/* SearchResults reads ?q= through useSearchParams, which Next requires
            to sit inside a Suspense boundary. */}
        <Suspense fallback={null}>
          <SearchResults />
        </Suspense>
      </PageBody>
    </>
  );
}
