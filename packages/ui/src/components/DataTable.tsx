import type { ReactNode } from "react";

/**
 * The admin panel is mostly tables, so they get real components rather than
 * bare <table> plus a pile of repeated classes.
 *
 * A plain semantic table, not a grid of divs: sortable columns and row
 * semantics come free, and screen readers announce "column 3 of 5" without
 * any ARIA scaffolding to maintain.
 */
export function Table({ children }: { children: ReactNode }) {
  return (
    // Tables are the one thing that legitimately overflows on a phone. Scroll
    // the table, never the page — a horizontally scrolling body breaks
    // everything else on the screen.
    <div className="overflow-x-auto rounded-card border border-line bg-surface shadow-card">
      <table className="w-full border-collapse text-left text-sm">
        {children}
      </table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return (
    <thead className="border-b border-line bg-surface-sunken">{children}</thead>
  );
}

export function TH({
  children,
  align = "left",
}: {
  children: ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      scope="col"
      className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-subtle ${
        align === "right" ? "text-right" : ""
      }`}
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
}: {
  children: ReactNode;
  align?: "left" | "right";
  muted?: boolean;
}) {
  return (
    <td
      className={`px-4 py-3 align-middle ${align === "right" ? "text-right" : ""} ${
        muted ? "text-ink-muted" : "text-ink"
      }`}
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
