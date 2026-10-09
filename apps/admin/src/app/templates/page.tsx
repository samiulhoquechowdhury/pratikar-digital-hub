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
        actions={
          <div className="flex gap-2">
            <ButtonLink variant="secondary" href="/templates/from-storage">
              Build from a stored form
            </ButtonLink>
            <ButtonLink href="/templates/new">New template</ButtonLink>
          </div>
        }
      />
      <PageBody>
        <TemplateList />
      </PageBody>
    </RequireStaff>
  );
}
