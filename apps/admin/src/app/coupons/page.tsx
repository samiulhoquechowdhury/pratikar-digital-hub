"use client";

import { PageBody, PageHeader } from "@pratikar/ui";

import { CouponManager } from "@/features/coupons/components/CouponManager";
import { RequireStaff } from "@/shared/components/RequireStaff";

export default function Page() {
  return (
    <RequireStaff>
      <PageHeader
        title="Coupons"
        description="Discount codes customers enter at checkout. A code counts as used only when its order is paid."
      />
      <PageBody>
        <CouponManager />
      </PageBody>
    </RequireStaff>
  );
}
