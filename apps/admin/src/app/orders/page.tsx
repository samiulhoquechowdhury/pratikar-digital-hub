"use client";

import Link from "next/link";

import { OrderList } from "@/features/orders";
import { RequireStaff } from "@/shared/components/RequireStaff";

export default function OrdersPage() {
  return (
    <RequireStaff>
      <main>
        <p>
          <Link href="/">← Admin home</Link>
        </p>
        <h1>Orders</h1>
        <OrderList />
      </main>
    </RequireStaff>
  );
}
