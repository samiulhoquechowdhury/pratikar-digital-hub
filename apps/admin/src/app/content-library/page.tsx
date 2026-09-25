"use client";

import { ButtonLink, PageBody, PageHeader } from "@pratikar/ui";

import { ContentItemList } from "@/features/content-library";
import { RequireStaff } from "@/shared/components/RequireStaff";

export default function Page() {
  return (
    <RequireStaff>
      <PageHeader
        title="Content library"
        description="E-books, checklists and fill-in-the-blank forms, sold individually."
        actions={
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/content-library/import" variant="secondary">
              Import from storage
            </ButtonLink>
            <ButtonLink href="/content-library/new">New item</ButtonLink>
          </div>
        }
      />
      <PageBody>
        <ContentItemList />
      </PageBody>
    </RequireStaff>
  );
}
