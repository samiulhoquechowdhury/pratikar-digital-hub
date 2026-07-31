"use client";

import { ButtonLink, PageBody, PageHeader } from "@pratikar/ui";

import { TemplateList } from "@/features/templates";
import { RequireStaff } from "@/shared/components/RequireStaff";

export default function Page() {
  return (
    <RequireStaff>
      <PageHeader
        title="Templates"
        description="Document templates customers fill in to generate a document."
        actions={<ButtonLink href="/templates/new">New template</ButtonLink>}
      />
      <PageBody>
        <TemplateList />
      </PageBody>
    </RequireStaff>
  );
}
