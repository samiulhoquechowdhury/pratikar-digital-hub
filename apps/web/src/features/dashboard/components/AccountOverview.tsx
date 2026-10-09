"use client";

import type { CustomerOrder, Enrollment } from "@pratikar/types";
import { Badge } from "@pratikar/ui";
import { formatPaise } from "@pratikar/utils";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  FileText,
  GraduationCap,
  PlayCircle,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { documentStage } from "@/features/documents/lib/documentStage";
import { Icon } from "@/shared/components/Icon";

import { legacyHashTarget } from "../lib/accountNav";

import { AccountPageHeader, useAccount } from "./AccountShell";
import { DashboardSummary } from "./DashboardSummary";

/** Courses whose access ends within this many days get a reminder here. */
const EXPIRY_WARNING_DAYS = 14;
const DAY_MS = 24 * 3600 * 1000;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const ORDER_STATUS: Record<
  CustomerOrder["status"],
  { label: string; tone: "success" | "warning" | "danger" | "neutral" }
> = {
  PAID: { label: "Paid", tone: "success" },
  PENDING: { label: "Pending", tone: "warning" },
  FAILED: { label: "Failed", tone: "danger" },
  REFUNDED: { label: "Refunded", tone: "neutral" },
};

/** What an order was for, in a few words. */
export const orderTitle = (order: CustomerOrder) =>
  order.course?.title ??
  order.contentLibraryItem?.title ??
  order.generatedDocument?.template?.title ??
  order.generatedDocument?.title ??
  "Order";

const progressOf = (enrollment: Enrollment) => {
  const done = enrollment.progress?.length ?? 0;
  const total = enrollment.course._count?.modules ?? 0;
  return total > 0 ? Math.round((done / total) * 100) : 0;
};

/**
 * The account's front page: what needs doing, what to pick up again, and
 * what was bought lately — each with a way into the page that holds the rest.
 */
export function AccountOverview() {
  const router = useRouter();
  const { data } = useAccount();

  // Links in emails already sent point at the old tabbed page's hashes.
  useEffect(() => {
    const target = legacyHashTarget(window.location.hash);
    if (target) router.replace(target);
  }, [router]);

  const now = Date.now();
  const waitingOnYou = data.documents.filter(
    (d) => documentStage(d).needsAction,
  );
  const live = data.enrollments.filter(
    (e) => new Date(e.expiresAt).getTime() > now,
  );
  const expiringSoon = live.filter(
    (e) =>
      !e.completedAt &&
      new Date(e.expiresAt).getTime() - now < EXPIRY_WARNING_DAYS * DAY_MS,
  );
  const inProgress = live.filter((e) => !e.completedAt).slice(0, 3);
  const recentOrders = data.orders.slice(0, 4);

  const isEmpty =
    data.documents.length === 0 &&
    data.enrollments.length === 0 &&
    data.orders.length === 0;

  return (
    <>
      <AccountPageHeader
        title="Dashboard"
        description="Everything you've created, enrolled in and bought, at a glance."
      />

      <div className="space-y-10">
        <DashboardSummary data={data} />

        {(waitingOnYou.length > 0 || expiringSoon.length > 0) && (
          <section aria-labelledby="attention-title">
            <h3 id="attention-title" className="text-lg font-semibold">
              Needs your attention
            </h3>
            <ul className="mt-4 space-y-3">
              {waitingOnYou.slice(0, 3).map((doc) => (
                <Attention
                  key={doc.id}
                  href={`/dashboard/documents/${doc.id}`}
                  title={`${doc.title} — ${documentStage(doc).label.toLowerCase()}`}
                  body="Open it to preview, send for review or download."
                />
              ))}
              {expiringSoon.map((enrollment) => (
                <Attention
                  key={enrollment.id}
                  href={`/learn/${enrollment.id}`}
                  title={`Access to “${enrollment.course.title}” ends on ${formatDate(enrollment.expiresAt)}`}
                  body="Finish the remaining lessons to earn your certificate before then."
                />
              ))}
            </ul>
          </section>
        )}

        {inProgress.length > 0 && (
          <section aria-labelledby="continue-title">
            <SectionTitle
              id="continue-title"
              title="Continue learning"
              href="/dashboard/courses"
              linkLabel="All courses"
            />
            <ul className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {inProgress.map((enrollment) => {
                const percent = progressOf(enrollment);
                return (
                  <li key={enrollment.id}>
                    <Link
                      href={`/learn/${enrollment.id}`}
                      className="group flex h-full flex-col rounded-card border border-line bg-surface transition-shadow hover:shadow-raised"
                    >
                      <span className="grid h-24 place-items-center rounded-t-card bg-surface-inverse text-brand">
                        <Icon icon={PlayCircle} size="lg" />
                      </span>
                      <span className="flex flex-1 flex-col p-4">
                        <span className="font-semibold text-ink group-hover:text-primary">
                          {enrollment.course.title}
                        </span>
                        <span
                          className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface-sunken"
                          role="progressbar"
                          aria-valuenow={percent}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`${enrollment.course.title} progress`}
                        >
                          <span
                            className="block h-full rounded-full bg-brand"
                            style={{ width: `${percent}%` }}
                          />
                        </span>
                        <span className="mt-2 text-xs text-ink-muted">
                          {percent}% complete · access until{" "}
                          {formatDate(enrollment.expiresAt)}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {recentOrders.length > 0 && (
          <section aria-labelledby="orders-title">
            <SectionTitle
              id="orders-title"
              title="Recent orders"
              href="/dashboard/orders"
              linkLabel="All orders & invoices"
            />
            <ul className="mt-4 divide-y divide-line rounded-card border border-line bg-surface">
              {recentOrders.map((order) => {
                const status = ORDER_STATUS[order.status];
                return (
                  <li
                    key={order.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-ink">
                        {orderTitle(order)}
                      </span>
                      <span className="block text-xs text-ink-muted">
                        {formatDate(order.createdAt)}
                      </span>
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="text-sm tabular-nums text-ink">
                        {formatPaise(order.amount + order.gstAmount)}
                      </span>
                      <Badge tone={status.tone}>{status.label}</Badge>
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {isEmpty && (
          <section aria-labelledby="start-title">
            <h3 id="start-title" className="text-lg font-semibold">
              Get started
            </h3>
            <ul className="mt-4 grid gap-4 md:grid-cols-3">
              <StartCard
                href="/documents"
                icon={FileText}
                title="Create a document"
                body="Rent agreements, offer letters and more, from a few answers."
              />
              <StartCard
                href="/courses"
                icon={GraduationCap}
                title="Take a course"
                body="Short video courses that end in a verifiable certificate."
              />
              <StartCard
                href="/content-library"
                icon={BookOpen}
                title="Browse the library"
                body="Forms, checklists and e-books to download and keep."
              />
            </ul>
          </section>
        )}
      </div>
    </>
  );
}

function SectionTitle({
  id,
  title,
  href,
  linkLabel,
}: {
  id: string;
  title: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h3 id={id} className="text-lg font-semibold">
        {title}
      </h3>
      <Link
        href={href}
        className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary-hover"
      >
        {linkLabel}
        <Icon icon={ArrowRight} size="xs" />
      </Link>
    </div>
  );
}

function Attention({
  href,
  title,
  body,
}: {
  href: string;
  title: string;
  body: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-start gap-3 rounded-card border border-brand-border bg-brand-subtle px-4 py-3 transition-colors hover:border-brand"
      >
        <Icon icon={AlertCircle} className="mt-0.5 shrink-0 text-gold-ink" />
        <span>
          <span className="block text-sm font-semibold text-ink">{title}</span>
          <span className="block text-sm text-ink-muted">{body}</span>
        </span>
      </Link>
    </li>
  );
}

function StartCard({
  href,
  icon,
  title,
  body,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  body: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex h-full flex-col gap-3 rounded-card border border-line bg-surface p-5 transition-shadow hover:shadow-raised"
      >
        <span className="grid h-10 w-10 place-items-center rounded-control bg-primary-subtle text-primary">
          <Icon icon={icon} size="md" />
        </span>
        <span className="font-semibold text-ink">{title}</span>
        <span className="text-sm text-ink-muted">{body}</span>
      </Link>
    </li>
  );
}
