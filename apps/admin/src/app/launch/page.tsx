"use client";

import { PageBody, PageHeader } from "@pratikar/ui";

import { LaunchChecklist } from "@/features/readiness";
import { RequireStaff } from "@/shared/components/RequireStaff";

export default function Page() {
  return (
    <RequireStaff>
      <PageHeader
        title="Launch checklist"
        description="Every service and setting the live site needs — tried for real, with what to do about anything that isn't right."
      />
      <PageBody>
        <LaunchChecklist />
      </PageBody>
    </RequireStaff>
  );
}
