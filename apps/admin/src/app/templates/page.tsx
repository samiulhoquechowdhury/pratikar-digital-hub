"use client";

import Link from "next/link";

import { TemplateList } from "@/features/templates";
import { RequireStaff } from "@/shared/components/RequireStaff";

export default function TemplatesPage() {
  return (
    <RequireStaff>
      <main>
        <p>
          <Link href="/">← Admin home</Link>
        </p>
        <h1>Templates</h1>
        <TemplateList />
      </main>
    </RequireStaff>
  );
}
