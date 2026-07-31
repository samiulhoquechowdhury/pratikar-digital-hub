"use client";

import { PageBody, PageHeader } from "@pratikar/ui";

import { OrderList } from "@/features/orders";
import { RequireStaff } from "@/shared/components/RequireStaff";

export default function Page() {
  return (
    <RequireStaff>
      <PageHeader
        title="Orders"
        description="Every order placed, with refunds for Admins and above."
      />
      <PageBody>
        <OrderList />
      </PageBody>
    </RequireStaff>
  );
}
