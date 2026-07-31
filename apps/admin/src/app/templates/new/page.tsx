"use client";

import { PageBody, PageHeader } from "@pratikar/ui";
import Link from "next/link";

import { TemplateForm } from "@/features/templates";
import { RequireStaff } from "@/shared/components/RequireStaff";

// No <main>: AdminShell already renders one around every page here, and a
// second landmark makes the page ambiguous to a screen reader.
export default function NewTemplatePage() {
  return (
    <RequireStaff>
      <PageHeader
        title="New template"
        description="Save as a draft first — the .docx is attached after the template exists."
        actions={
          <Link
            href="/templates"
            className="text-sm font-medium text-primary hover:text-primary-hover"
          >
            <span aria-hidden>←</span> All templates
          </Link>
        }
      />
      <PageBody>
        <TemplateForm />
      </PageBody>
    </RequireStaff>
  );
}
