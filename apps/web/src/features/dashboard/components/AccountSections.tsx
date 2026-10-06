"use client";

import { ButtonLink } from "@pratikar/ui";

import { MyDocuments } from "@/features/documents";
import { MyCourses } from "@/features/lms";
import { MyPurchases } from "@/features/payments";

import { AccountPageHeader, useAccount } from "./AccountShell";
import { MyLibrary } from "./MyLibrary";

/*
 * One component per account page. Each reads the account the layout has
 * already loaded and hands its slice to the list that renders it.
 */

export function DocumentsSection() {
  const { data } = useAccount();
  return (
    <>
      <AccountPageHeader
        title="My documents"
        description="Documents you've generated — pay, download, or send one for an advocate's review."
        action={
          <ButtonLink href="/documents" size="sm">
            New document
          </ButtonLink>
        }
      />
      <MyDocuments documents={data.documents} />
    </>
  );
}

export function CoursesSection() {
  const { data } = useAccount();
  return (
    <>
      <AccountPageHeader
        title="My courses"
        description="Your enrolments, progress and certificates."
        action={
          <ButtonLink href="/courses" size="sm" variant="secondary">
            Browse courses
          </ButtonLink>
        }
      />
      <MyCourses enrollments={data.enrollments} />
    </>
  );
}

export function LibrarySection() {
  const { data } = useAccount();
  return (
    <>
      <AccountPageHeader
        title="My library"
        description="E-books, checklists and forms you've bought, ready to download again."
        action={
          <ButtonLink href="/content-library" size="sm" variant="secondary">
            Browse the library
          </ButtonLink>
        }
      />
      <MyLibrary orders={data.orders} />
    </>
  );
}

export function OrdersSection() {
  const { data } = useAccount();
  return (
    <>
      <AccountPageHeader
        title="Orders & invoices"
        description="Every payment, with its GST invoice to download."
      />
      <MyPurchases orders={data.orders} />
    </>
  );
}
