"use client";

import { PageBody, PageHeader } from "@pratikar/ui";

import { AssistantInsightsView } from "@/features/assistant-insights";
import { RequireStaff } from "@/shared/components/RequireStaff";

export default function Page() {
  return (
    <RequireStaff>
      <PageHeader
        title="Assistant insights"
        description="What customers ask the AI assistant — and what they looked for that the catalogue doesn't have yet."
      />
      <PageBody>
        <AssistantInsightsView />
      </PageBody>
    </RequireStaff>
  );
}
