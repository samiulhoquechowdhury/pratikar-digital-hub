"use client";

import { PageBody, PageHeader } from "@pratikar/ui";

import { TemplateFromStorage } from "@/features/templates";
import { RequireStaff } from "@/shared/components/RequireStaff";

export default function Page() {
  return (
    <RequireStaff>
      <PageHeader
        title="Build from a stored form"
        description="Name the blanks in a form already in storage and turn it into a template the generator can fill."
      />
      <PageBody>
        <TemplateFromStorage />
      </PageBody>
    </RequireStaff>
  );
}
