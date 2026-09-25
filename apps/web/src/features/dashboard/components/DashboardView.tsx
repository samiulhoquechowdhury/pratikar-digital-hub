"use client";

import {
  Alert,
  Button,
  ButtonLink,
  EmptyState,
  PageBody,
  PageHeader,
  Skeleton,
  SkeletonList,
} from "@pratikar/ui";

import { MyDocuments } from "@/features/documents";
import { MyCourses } from "@/features/lms";
import { MyPurchases } from "@/features/payments";
import { useAuth } from "@/shared/providers/AuthProvider";

import { useDashboardData } from "../hooks/useDashboardData";

import { DashboardSummary } from "./DashboardSummary";
import { DashboardTabs } from "./DashboardTabs";

/**
 * The customer's account.
 *
 * Restructured from three stacked lists into a summary over tabs. Stacking
 * them meant three different shapes down one page — full-width cards, a
 * two-column grid, then a six-column table — with no answer to "what do I
 * have" until you had scrolled all of it. It also meant the signed-out state
 * rendered three identical "Sign in" prompts, because each list gated auth
 * for itself. Both are handled once, here.
 */
export function DashboardView() {
  const { user } = useAuth();
  const { data, isLoading, error, reload } = useDashboardData();

  return (
    <>
      <PageHeader
        title="Your account"
        description="Everything you've created, enrolled in, and paid for."
      />
      <PageBody className="space-y-8">
        {isLoading ? (
          <DashboardSkeleton />
        ) : !user ? (
          <EmptyState
            title="Sign in to see your account"
            description="Your documents, courses, purchases and invoices all live here."
            action={
              <ButtonLink href="/login?next=/dashboard">Sign in</ButtonLink>
            }
          />
        ) : error ? (
          <Alert tone="danger" role="alert">
            <div className="flex flex-wrap items-center gap-4">
              <span>{error}</span>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => void reload()}
              >
                Try again
              </Button>
            </div>
          </Alert>
        ) : data ? (
          <>
            <DashboardSummary data={data} />
            <DashboardTabs
              tabs={[
                {
                  id: "documents",
                  label: "Documents",
                  count: data.documents.length,
                  panel: <MyDocuments documents={data.documents} />,
                },
                {
                  id: "courses",
                  label: "Courses",
                  count: data.enrollments.length,
                  panel: <MyCourses enrollments={data.enrollments} />,
                },
                {
                  id: "purchases",
                  label: "Purchases",
                  count: data.orders.length,
                  panel: <MyPurchases orders={data.orders} />,
                },
              ]}
            />
          </>
        ) : null}
      </PageBody>
    </>
  );
}

/**
 * Holds the shape of the loaded page — four tiles, a tab row, a list — so
 * nothing jumps when the data lands. Previously three panels each showed
 * their own skeleton and resolved at their own moment, so the page visibly
 * reassembled itself on every visit.
 */
function DashboardSkeleton() {
  return (
    <div role="status" aria-busy="true" className="space-y-8">
      <span className="sr-only">Loading your account…</span>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="space-y-2 rounded-card border border-line bg-surface p-4 shadow-card"
          >
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-12" />
          </div>
        ))}
      </div>
      <div className="flex gap-6 border-b border-line pb-3">
        {["w-24", "w-20", "w-28"].map((w) => (
          <Skeleton key={w} className={`h-4 ${w}`} />
        ))}
      </div>
      <SkeletonList rows={3} label="Loading your account…" />
    </div>
  );
}
