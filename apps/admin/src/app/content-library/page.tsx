"use client";

import Link from "next/link";

import { ContentItemList } from "@/features/content-library";
import { RequireStaff } from "@/shared/components/RequireStaff";

export default function ContentLibraryPage() {
  return (
    <RequireStaff>
      <main>
        <p>
          <Link href="/">← Admin home</Link>
        </p>
        <h1>Content library</h1>
        <ContentItemList />
      </main>
    </RequireStaff>
  );
}
