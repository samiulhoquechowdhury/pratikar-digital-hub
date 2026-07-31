"use client";

import { ButtonLink, PageBody, PageHeader } from "@pratikar/ui";

import { ContentItemList } from "@/features/content-library";
import { RequireStaff } from "@/shared/components/RequireStaff";

export default function Page() {
  return (
    <RequireStaff>
      <PageHeader
        title="Content library"
        description="E-books and checklists sold individually."
        actions={<ButtonLink href="/content-library/new">New item</ButtonLink>}
      />
      <PageBody>
        <ContentItemList />
      </PageBody>
    </RequireStaff>
  );
}
