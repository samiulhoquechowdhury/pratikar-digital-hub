"use client";

import { PageBody, PageHeader } from "@pratikar/ui";

import { IntegrationsPanel } from "@/features/integrations/components/IntegrationsPanel";
import { RequireStaff } from "@/shared/components/RequireStaff";

export default function Page() {
  return (
    <RequireStaff>
      <PageHeader
        title="Integrations"
        description="The API keys for the services the site runs on — SMS, email, payments and AI. Saved keys work straight away, with no redeploy."
      />
      <PageBody>
        <IntegrationsPanel />
      </PageBody>
    </RequireStaff>
  );
}
