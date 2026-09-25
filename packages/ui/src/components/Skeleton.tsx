import type { ReactNode } from "react";

/**
 * Loading placeholders that hold the shape of what's coming.
 *
 * These replace a bare "Loading…" line. The difference isn't decoration: a
 * text line collapses the layout to nothing and then shoves everything into
 * place when data lands, so the page jumps under the reader. A skeleton
 * reserves the space, so arriving content slots in instead of reflowing.
 *
 * ── HOW THESE ARE ANNOUNCED ────────────────────────────────────────────────
 * The shapes are `aria-hidden` — a screen reader has no use for "grey
 * rectangle, grey rectangle". Each block carries one polite status message
 * instead, which is what a bare <Loading> was already doing correctly and what
 * a naive skeleton usually loses.
 *
 * The shimmer is a CSS animation, so `prefers-reduced-motion` in globals.css
 * already flattens it to a static block without anything extra here.
 */

const SHIMMER =
  "animate-pulse rounded bg-surface-sunken motion-reduce:animate-none";

/** One grey bar. Width is a Tailwind class so callers control the rhythm. */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`${SHIMMER} ${className}`} />;
}

/**
 * Wraps a set of shapes with the single status message that speaks for them.
 * Every skeleton below routes through this so none of them can forget it.
 */
function LoadingRegion({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div role="status" aria-busy="true">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

/**
 * Paragraph-shaped. The last line is short because real paragraphs end
 * mid-line — a stack of equal bars reads as a chart, not as text.
 */
export function SkeletonText({
  lines = 3,
  label = "Loading…",
}: {
  lines?: number;
  label?: string;
}) {
  return (
    <LoadingRegion label={label}>
      <div className="space-y-2.5">
        {Array.from({ length: lines }, (_, i) => (
          <Skeleton
            key={i}
            className={`h-3.5 ${i === lines - 1 ? "w-2/5" : "w-full"}`}
          />
        ))}
      </div>
    </LoadingRegion>
  );
}

/**
 * A grid of card placeholders, matching the catalogue layouts. `media` draws
 * the banner area that course cards have and content-library rows don't.
 */
export function SkeletonCards({
  count = 6,
  media = true,
  label = "Loading…",
}: {
  count?: number;
  media?: boolean;
  label?: string;
}) {
  return (
    <LoadingRegion label={label}>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: count }, (_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-card border border-line bg-surface shadow-card"
          >
            {media && <Skeleton className="h-24 rounded-none" />}
            <div className="space-y-3 p-5">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
              <div className="flex items-center justify-between pt-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-7 w-20 rounded-control" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </LoadingRegion>
  );
}

/**
 * Table-shaped, inside the same bordered card a real Table renders into, so
 * the frame doesn't pop into existence when the rows arrive.
 */
export function SkeletonTable({
  rows = 5,
  columns = 4,
  label = "Loading…",
}: {
  rows?: number;
  columns?: number;
  label?: string;
}) {
  return (
    <LoadingRegion label={label}>
      <div className="overflow-hidden rounded-card border border-line bg-surface shadow-card">
        <div className="border-b border-line bg-canvas px-4 py-3">
          <div className="flex gap-4">
            {Array.from({ length: columns }, (_, i) => (
              <Skeleton key={i} className="h-3 flex-1" />
            ))}
          </div>
        </div>
        <div className="divide-y divide-line">
          {Array.from({ length: rows }, (_, r) => (
            <div key={r} className="flex gap-4 px-4 py-4">
              {Array.from({ length: columns }, (_, c) => (
                <Skeleton
                  key={c}
                  // Varying widths so rows don't look like a printed grid.
                  className={`h-3.5 flex-1 ${c === 0 ? "" : "max-w-[8rem]"}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </LoadingRegion>
  );
}

/** A stacked list of rows — dashboards, sidebars, queues. */
export function SkeletonList({
  rows = 4,
  label = "Loading…",
}: {
  rows?: number;
  label?: string;
}) {
  return (
    <LoadingRegion label={label}>
      <div className="space-y-3">
        {Array.from({ length: rows }, (_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-card border border-line bg-surface p-4 shadow-card"
          >
            <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-3.5 w-1/3" />
              <Skeleton className="h-3 w-2/3" />
            </div>
            <Skeleton className="h-7 w-20 shrink-0 rounded-control" />
          </div>
        ))}
      </div>
    </LoadingRegion>
  );
}

/**
 * Form-shaped: label, control, repeated. Used where a screen has to fetch
 * before it can render fields (template forms, the quiz editor).
 */
export function SkeletonForm({
  fields = 4,
  label = "Loading…",
}: {
  fields?: number;
  label?: string;
}) {
  return (
    <LoadingRegion label={label}>
      <div className="space-y-5 rounded-card border border-line bg-surface p-6 shadow-card">
        {Array.from({ length: fields }, (_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-10 w-full rounded-control" />
          </div>
        ))}
      </div>
    </LoadingRegion>
  );
}
