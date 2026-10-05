"use client";

import { Alert, Button, Card, Skeleton } from "@pratikar/ui";
import { formatPaise } from "@pratikar/utils";
import { useCallback, useEffect, useState } from "react";

import {
  analyticsApi,
  type Analytics,
  type AnalyticsPeriod,
} from "../api/analyticsApi";
import {
  axisLabelStep,
  barHeightPercent,
  conversionPercent,
  shareOf,
} from "../lib/analyticsView";

const PERIODS: { days: AnalyticsPeriod; label: string }[] = [
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
  { days: 365, label: "12 months" },
];

const ITEM_TYPE_LABELS: Record<
  Analytics["byType"][number]["itemType"],
  string
> = {
  DOCUMENT: "Documents",
  DOCUMENT_REVIEW: "Lawyer reviews",
  CONTENT_ITEM: "Library",
  COURSE: "Courses",
};

const LIBRARY_TYPE_LABELS = {
  EBOOK: "E-book",
  CHECKLIST: "Checklist",
  FORM: "Form",
} as const;

/** "2026-10-05" → "5 Oct", as the day was in India. */
const shortDay = (day: string) =>
  new Date(`${day}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });

/** Whole rupees for axis-sized numbers — "₹12,345". */
const rupees = (paise: number) => formatPaise(Math.round(paise / 100) * 100);

/**
 * The admin home's numbers: what sold, what was generated, who joined, over
 * a chosen period — the analytics docs/srs.md asks for in 3.2, 3.4 and 3.10.
 */
export function AnalyticsDashboard() {
  const [days, setDays] = useState<AnalyticsPeriod>(30);
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback((period: AnalyticsPeriod) => {
    setError(false);
    analyticsApi
      .overview(period)
      .then(setData)
      .catch(() => setError(true));
  }, []);

  useEffect(() => load(days), [days, load]);

  const conversion = data ? conversionPercent(data.documents) : null;

  return (
    <section aria-labelledby="analytics-title" className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="analytics-title" className="text-xl font-semibold">
            Performance
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            {data
              ? `${shortDay(data.period.from)} – ${shortDay(data.period.to)}, India time. Amounts include GST.`
              : "Amounts include GST."}
          </p>
        </div>
        {/* One row of filters, above everything they control. */}
        <div
          role="group"
          aria-label="Period"
          className="inline-flex rounded-control border border-line bg-surface p-1"
        >
          {PERIODS.map((period) => (
            <button
              key={period.days}
              type="button"
              aria-pressed={days === period.days}
              onClick={() => setDays(period.days)}
              className={`rounded-control px-3 py-1.5 text-sm font-medium transition-colors ${
                days === period.days
                  ? "bg-primary text-ink-inverse"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <Alert tone="danger" role="alert">
          <div className="flex flex-wrap items-center gap-4">
            <span>Couldn&apos;t load the numbers.</span>
            <Button size="sm" variant="secondary" onClick={() => load(days)}>
              Try again
            </Button>
          </div>
        </Alert>
      ) : !data ? (
        <div role="status" aria-busy="true" className="space-y-4">
          <span className="sr-only">Loading the numbers…</span>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </div>
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat
              label="Revenue"
              value={formatPaise(data.revenue.grossPaise)}
              note={`incl. ${formatPaise(data.revenue.gstPaise)} GST`}
            />
            <Stat
              label="Paid orders"
              value={String(data.revenue.orders)}
              note={
                data.revenue.orders > 0
                  ? `${formatPaise(data.revenue.averageOrderPaise)} average`
                  : undefined
              }
            />
            <Stat
              label="Documents generated"
              value={String(data.documents.generated)}
              note={
                conversion !== null
                  ? `${data.documents.paid} paid for (${conversion}%)`
                  : undefined
              }
            />
            <Stat label="New customers" value={String(data.newCustomers)} />
          </dl>

          {(data.refunds.orders > 0 || data.reviewsWaiting > 0) && (
            <ul className="flex flex-wrap gap-3 text-sm">
              {data.reviewsWaiting > 0 && (
                <li className="rounded-full border border-warning-border bg-warning-subtle px-3 py-1 text-warning-text">
                  {data.reviewsWaiting} lawyer{" "}
                  {data.reviewsWaiting === 1 ? "review" : "reviews"} waiting
                </li>
              )}
              {data.refunds.orders > 0 && (
                <li className="rounded-full border border-line bg-surface px-3 py-1 text-ink-muted">
                  {data.refunds.orders} refunded (
                  {formatPaise(data.refunds.grossPaise)}) — not in revenue
                </li>
              )}
            </ul>
          )}

          <Card className="p-6">
            <h3 className="text-base font-semibold">Revenue by day</h3>
            <RevenueChart daily={data.daily} />
          </Card>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="p-6">
              <h3 className="text-base font-semibold">Revenue by product</h3>
              {data.byType.length === 0 ? (
                <Empty />
              ) : (
                <ul className="mt-4 space-y-4">
                  {data.byType.map((row) => (
                    <li key={row.itemType}>
                      <div className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="text-ink">
                          {ITEM_TYPE_LABELS[row.itemType]}
                        </span>
                        <span className="tabular-nums text-ink">
                          {formatPaise(row.grossPaise)}
                        </span>
                      </div>
                      <div className="mt-1.5 h-2 rounded-full bg-surface-sunken">
                        <div
                          className="h-full rounded-full bg-chart-bar"
                          style={{
                            width: `${shareOf(row.grossPaise, data.revenue.grossPaise)}%`,
                          }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-ink-muted">
                        {row.orders} {row.orders === 1 ? "order" : "orders"}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="p-6">
              <h3 className="text-base font-semibold">
                Most generated templates
              </h3>
              {data.topTemplates.length === 0 ? (
                <Empty />
              ) : (
                <table className="mt-4 w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-ink-muted">
                      <th className="pb-2 font-medium">Template</th>
                      <th className="pb-2 text-right font-medium">Made</th>
                      <th className="pb-2 text-right font-medium">Paid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {data.topTemplates.map((row) => (
                      <tr key={row.templateId}>
                        <td className="py-2 pr-2 text-ink">{row.title}</td>
                        <td className="py-2 text-right tabular-nums">
                          {row.generated}
                        </td>
                        <td className="py-2 text-right tabular-nums">
                          {row.paid}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>

            <Card className="p-6">
              <h3 className="text-base font-semibold">
                Best-selling library items
              </h3>
              {data.topLibraryItems.length === 0 ? (
                <Empty />
              ) : (
                <table className="mt-4 w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-ink-muted">
                      <th className="pb-2 font-medium">Item</th>
                      <th className="pb-2 text-right font-medium">Sold</th>
                      <th className="pb-2 text-right font-medium">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {data.topLibraryItems.map((row) => (
                      <tr key={row.id ?? row.title}>
                        <td className="py-2 pr-2">
                          <span className="block text-ink">{row.title}</span>
                          {row.type && (
                            <span className="text-xs text-ink-muted">
                              {LIBRARY_TYPE_LABELS[row.type]}
                            </span>
                          )}
                        </td>
                        <td className="py-2 text-right tabular-nums">
                          {row.orders}
                        </td>
                        <td className="py-2 text-right tabular-nums">
                          {formatPaise(row.grossPaise)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          </div>
        </>
      )}
    </section>
  );
}

function Stat({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="rounded-card border border-line bg-surface p-5">
      <dt className="text-xs font-medium uppercase tracking-wider text-ink-muted">
        {label}
      </dt>
      <dd className="mt-2 text-2xl font-semibold tabular-nums text-ink">
        {value}
      </dd>
      {note && <p className="mt-1 text-xs text-ink-muted">{note}</p>}
    </div>
  );
}

function Empty() {
  return <p className="mt-4 text-sm text-ink-muted">Nothing in this period.</p>;
}

/**
 * Revenue per day as bars — one series, so no legend; the heading names it.
 * Hovering or focusing a bar shows its day, revenue and order count. The
 * table beneath is the same numbers for screen readers.
 */
function RevenueChart({ daily }: { daily: Analytics["daily"] }) {
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(...daily.map((d) => d.grossPaise), 0);
  const total = daily.reduce((sum, d) => sum + d.grossPaise, 0);
  // Label a handful of days along the bottom, not every one.
  const labelEvery = axisLabelStep(daily.length);
  const shown = active !== null ? daily[active] : undefined;

  if (total === 0) {
    return <Empty />;
  }

  return (
    <div className="mt-4">
      <p className="h-5 text-sm text-ink-muted" aria-live="polite">
        {shown
          ? `${shortDay(shown.day)}: ${formatPaise(shown.grossPaise)} from ${shown.orders} ${
              shown.orders === 1 ? "order" : "orders"
            }`
          : `Highest day: ${rupees(max)}`}
      </p>

      <div aria-hidden className="relative mt-3">
        {/* One recessive gridline at the top, labelled with the scale. */}
        <div className="absolute inset-x-0 top-0 border-t border-dashed border-line" />
        <span className="absolute -top-2.5 right-0 bg-surface pl-1 text-[0.6875rem] text-ink-muted">
          {rupees(max)}
        </span>
        <div
          className="flex h-48 items-end"
          style={{ gap: daily.length > 60 ? 1 : 2 }}
          onMouseLeave={() => setActive(null)}
        >
          {daily.map((day, index) => (
            <div
              key={day.day}
              className="flex h-full flex-1 items-end"
              onMouseEnter={() => setActive(index)}
            >
              <div
                className={`w-full rounded-t-[4px] transition-opacity ${
                  day.grossPaise > 0 ? "bg-chart-bar" : ""
                } ${active !== null && active !== index ? "opacity-50" : ""}`}
                style={{
                  height: `${barHeightPercent(day.grossPaise, max)}%`,
                }}
              />
            </div>
          ))}
        </div>
        <div className="mt-1 border-t border-line" />
        <div className="mt-1.5 flex">
          {daily.map((day, index) => (
            <span
              key={day.day}
              className="flex-1 overflow-visible whitespace-nowrap text-[0.6875rem] text-ink-muted"
            >
              {index % labelEvery === 0 ? shortDay(day.day) : ""}
            </span>
          ))}
        </div>
      </div>

      <table className="sr-only">
        <caption>Revenue by day</caption>
        <thead>
          <tr>
            <th>Day</th>
            <th>Revenue</th>
            <th>Orders</th>
          </tr>
        </thead>
        <tbody>
          {daily
            .filter((day) => day.orders > 0)
            .map((day) => (
              <tr key={day.day}>
                <td>{shortDay(day.day)}</td>
                <td>{formatPaise(day.grossPaise)}</td>
                <td>{day.orders}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
