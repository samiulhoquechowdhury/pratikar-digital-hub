"use client";

import Link from "next/link";

import { ContentItemForm } from "@/features/content-library";
import { RequireStaff } from "@/shared/components/RequireStaff";

export default function NewContentItemPage() {
  return (
    <RequireStaff>
      <main>
        <p>
          <Link href="/content-library">← Content library</Link>
        </p>
        <h1>New content item</h1>
        <ContentItemForm />
      </main>
    </RequireStaff>
  );
}
