"use client";

import { PageBody, PageHeader } from "@pratikar/ui";

import { SettingsPanel } from "@/features/settings/components/SettingsPanel";
import { RequireStaff } from "@/shared/components/RequireStaff";

export default function Page() {
  return (
    <RequireStaff>
      <PageHeader
        title="Settings"
        description="The certificate's wording, and system settings for Super Admins."
      />
      <PageBody>
        <SettingsPanel />
      </PageBody>
    </RequireStaff>
  );
}
