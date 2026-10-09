"use client";

import { ButtonLink, PageBody, PageHeader } from "@pratikar/ui";

import { StorageImport } from "@/features/content-library";
import { RequireStaff } from "@/shared/components/RequireStaff";

export default function Page() {
  return (
    <RequireStaff>
      <PageHeader
        title="Import from storage"
        description="Files already in the bucket, ready to be given a title and a price. Nothing is uploaded here."
        actions={
          <ButtonLink href="/content-library" variant="secondary">
            Back to the catalogue
          </ButtonLink>
        }
      />
      <PageBody>
        <StorageImport />
      </PageBody>
    </RequireStaff>
  );
}
