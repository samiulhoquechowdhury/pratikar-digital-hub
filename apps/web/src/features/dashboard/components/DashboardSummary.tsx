"use client";

import { formatPaise } from "@pratikar/utils";
import { FileText, GraduationCap, ShieldCheck, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Icon } from "@/shared/components/Icon";

import type { DashboardData } from "../hooks/useDashboardData";

/**
 * What you have, before what you have to look through.
 *
 * The page used to open straight onto three long lists, so answering "have I
 * paid for that yet" meant reading all of them. These four numbers are the
 * questions people actually arrive with, and the awaiting-payment count is
 * deliberately first — it is the only one that represents something unfinished.
 */
export function DashboardSummary({ data }: { data: DashboardData }) {
  const awaiting = data.documents.filter(
    (d) => d.status === "GENERATED",
  ).length;
  const activeCourses = data.enrollments.filter(
    (e) => new Date(e.expiresAt) > new Date(),
  ).length;
  const certificates = data.enrollments.filter((e) => e.certificate).length;
  const paid = data.orders
    .filter((o) => o.status === "PAID")
    .reduce((sum, o) => sum + o.amount + o.gstAmount, 0);

  return (
    <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Stat
        icon={FileText}
        label="Documents"
        value={String(data.documents.length)}
        note={awaiting > 0 ? `${awaiting} awaiting payment` : undefined}
        attention={awaiting > 0}
      />
      <Stat
        icon={GraduationCap}
        label="Active courses"
        value={String(activeCourses)}
        note={
          data.enrollments.length > activeCourses
            ? `${data.enrollments.length - activeCourses} ended`
            : undefined
        }
      />
      <Stat
        icon={ShieldCheck}
        label="Certificates"
        value={String(certificates)}
      />
      <Stat icon={Wallet} label="Total paid" value={formatPaise(paid)} />
    </dl>
  );
}

function Stat({
  icon,
  label,
  value,
  note,
  attention = false,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  note?: string;
  attention?: boolean;
}) {
  return (
    <div
      className={`rounded-card border bg-surface p-4 shadow-card ${
        attention ? "border-brand-border" : "border-line"
      }`}
    >
      <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-ink-subtle">
        <Icon icon={icon} size="xs" />
        {label}
      </dt>
      {/* Tabular figures so the four tiles line up rather than jittering
          against each other as the numbers change width. */}
      <dd className="mt-2 text-2xl font-semibold tabular-nums text-ink">
        {value}
      </dd>
      {note && (
        <p
          className={`mt-1 text-xs ${attention ? "font-medium text-gold-ink" : "text-ink-subtle"}`}
        >
          {note}
        </p>
      )}
    </div>
  );
}
