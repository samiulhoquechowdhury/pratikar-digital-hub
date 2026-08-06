"use client";

import { PageBody, PageHeader } from "@pratikar/ui";

import { UserList } from "@/features/users";
import { RequireStaff } from "@/shared/components/RequireStaff";

export default function Page() {
  return (
    <RequireStaff>
      <PageHeader
        title="Users"
        description="Staff and customer accounts. Only a Super Admin can change a role."
      />
      <PageBody>
        <UserList />
      </PageBody>
    </RequireStaff>
  );
}
