"use client";

import { PageBody, PageHeader } from "@pratikar/ui";

import { FaqManager } from "@/features/faq/components/FaqManager";
import { RequireStaff } from "@/shared/components/RequireStaff";

export default function Page() {
  return (
    <RequireStaff>
      <PageHeader
        title="FAQ"
        description="The questions on the site's FAQ page. Published answers are also what the AI assistant uses to explain how the site works."
      />
      <PageBody>
        <FaqManager />
      </PageBody>
    </RequireStaff>
  );
}
