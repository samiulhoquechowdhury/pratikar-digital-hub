import { Card } from "@pratikar/ui";
import type { ReactNode } from "react";

/**
 * The three content forms — template, course, content item — are the same
 * shape: a few groups of fields, then a save bar. These pieces exist so that
 * shape is stated once. They live here rather than in packages/ui because
 * nothing on the customer site has forms like this.
 */

export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Card className="p-6">
      <div className="border-b border-line pb-4">
        <h2 className="text-base">{title}</h2>
        {description && (
          <p className="mt-1 max-w-prose text-sm text-ink-muted">
            {description}
          </p>
        )}
      </div>
      <div className="mt-5">{children}</div>
    </Card>
  );
}

/**
 * Field rows sit in a two-column grid on wide screens. Admin forms are data
 * entry by someone who already knows what the fields mean — unlike the
 * customer-facing generator, where a single column slows people down on
 * purpose.
 */
export function FormGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-5 sm:grid-cols-2">{children}</div>;
}

/** Spans both columns of a FormGrid — for a textarea or a wide key input. */
export function FormRowFull({ children }: { children: ReactNode }) {
  return <div className="sm:col-span-2">{children}</div>;
}

/**
 * Sticky save bar. These forms run long — a template with twenty fields is
 * several screens — and hunting for the save button at the bottom every time
 * is the single most repeated annoyance in a content-entry tool.
 */
export function FormActions({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 -mx-4 mt-2 border-t border-line bg-surface/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}
