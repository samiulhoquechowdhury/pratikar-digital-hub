"use client";

import Link from "next/link";

import { ReviewQueue } from "@/features/reviews";
import { RequireStaff } from "@/shared/components/RequireStaff";

export default function ReviewsPage() {
  return (
    <RequireStaff>
      <main>
        <p>
          <Link href="/">← Admin home</Link>
        </p>
        <h1>Review queue</h1>
        <ReviewQueue />
      </main>
    </RequireStaff>
  );
}
