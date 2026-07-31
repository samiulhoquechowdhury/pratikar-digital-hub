"use client";

import { PageBody, PageHeader } from "@pratikar/ui";
import Link from "next/link";

import { ContentItemForm } from "@/features/content-library";
import { RequireStaff } from "@/shared/components/RequireStaff";

export default function NewContentItemPage() {
  return (
    <RequireStaff>
      <PageHeader
        title="New content item"
        description="An e-book or checklist customers buy once and download whenever they need it."
        actions={
          <Link
            href="/content-library"
            className="text-sm font-medium text-primary hover:text-primary-hover"
          >
            <span aria-hidden>←</span> All items
          </Link>
        }
      />
      <PageBody>
        <ContentItemForm />
      </PageBody>
    </RequireStaff>
  );
}
