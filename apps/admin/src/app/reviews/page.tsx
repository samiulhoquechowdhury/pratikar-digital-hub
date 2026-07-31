"use client";

import { PageBody, PageHeader } from "@pratikar/ui";

import { ReviewQueue } from "@/features/reviews";
import { RequireStaff } from "@/shared/components/RequireStaff";

export default function Page() {
  return (
    <RequireStaff>
      <PageHeader
        title="Review queue"
        description="Documents customers have paid to have a lawyer review."
      />
      <PageBody>
        <ReviewQueue />
      </PageBody>
    </RequireStaff>
  );
}
