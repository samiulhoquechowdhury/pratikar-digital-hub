import type { ReactNode } from "react";

/**
 * The admin panel is mostly tables, so they get real components rather than
 * bare <table> plus a pile of repeated classes.
 *
 * A plain semantic table, not a grid of divs: sortable columns and row
 * semantics come free, and screen readers announce "column 3 of 5" without
 * any ARIA scaffolding to maintain.
 */
export function Table({
  children,
  label,
}: {
  children: ReactNode;
  /**
   * Names the scrollable region, e.g. "Your purchases". Optional only so this
   * doesn't break every existing call site at once, but worth passing —
   * "scrollable region" is all a screen reader can say without it.
   */
  label?: string;
}) {
  return (
    // Tables are the one thing that legitimately overflows on a phone. Scroll
    // the table, never the page — a horizontally scrolling body breaks
    // everything else on the screen.
    //
    // tabIndex and role are not decoration: a scroll container that only
    // responds to a mouse wheel or a swipe is unreachable by keyboard, so the
    // columns past the fold simply don't exist for anyone tabbing through.
    // Making it a focusable region is the fix, and it needs a name to be
    // announced as anything more useful than "region".
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      className="overflow-x-auto rounded-card border border-line bg-surface shadow-card"
    >
      <table className="w-full border-collapse text-left text-sm">
        {children}
      </table>
    </div>
  );
}

/**
 * Columns that can be dropped on a phone rather than pushed off the edge.
 *
 * Applied to the TH and the matching TD — they have to agree, or the header
 * and the body shear apart. Reserve it for genuinely secondary columns; the
 * scroll is still there for anything that must not disappear.
 */
const SECONDARY_COLUMN = "hidden sm:table-cell";

export function THead({ children }: { children: ReactNode }) {
  return (
    <thead className="border-b border-line bg-surface-sunken">{children}</thead>
  );
}

export function TH({
  children,
  align = "left",
  secondary = false,
}: {
  children: ReactNode;
  align?: "left" | "right";
  /** Hide this column below `sm`. Must match the matching TD. */
  secondary?: boolean;
}) {
  return (
    <th
      scope="col"
      className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-subtle ${
        align === "right" ? "text-right" : ""
      } ${secondary ? SECONDARY_COLUMN : ""}`}
    >
      {children}
    </th>
  );
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-line">{children}</tbody>;
}

export function TR({ children }: { children: ReactNode }) {
  return <tr className="hover:bg-surface-sunken/60">{children}</tr>;
}

export function TD({
  children,
  align = "left",
  muted = false,
  secondary = false,
}: {
  children: ReactNode;
  align?: "left" | "right";
  muted?: boolean;
  /** Hide this cell below `sm`. Must match the matching TH. */
  secondary?: boolean;
}) {
  return (
    <td
      className={`px-4 py-3 align-middle ${align === "right" ? "text-right" : ""} ${
        muted ? "text-ink-muted" : "text-ink"
      } ${secondary ? SECONDARY_COLUMN : ""}`}
    >
      {children}
    </td>
  );
}

/** Full-width row for "nothing here yet", spanning every column. */
export function TEmpty({
  colSpan,
  children,
}: {
  colSpan: number;
  children: ReactNode;
}) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="px-4 py-10 text-center text-sm text-ink-muted"
      >
        {children}
      </td>
    </tr>
  );
}
