"use client";

import Link from "next/link";

import { TemplateForm } from "@/features/templates";
import { RequireStaff } from "@/shared/components/RequireStaff";

export default function NewTemplatePage() {
  return (
    <RequireStaff>
      <main>
        <p>
          <Link href="/templates">← Templates</Link>
        </p>
        <h1>New template</h1>
        <TemplateForm />
      </main>
    </RequireStaff>
  );
}
