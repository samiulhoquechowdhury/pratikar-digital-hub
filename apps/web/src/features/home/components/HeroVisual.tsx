import { BadgeCheck, CheckCircle2, FileText, PenLine } from "lucide-react";

import { Icon } from "@/shared/components/Icon";

/** A sample form's answers — illustrative, and plainly so (see below). */
const FIELDS = [
  { label: "Landlord", value: "R. Sharma", done: true },
  { label: "Tenant", value: "A. Banerjee", done: true },
  { label: "Monthly rent", value: "₹18,000", done: true },
  { label: "Start date", value: "", done: false },
];

/**
 * The hero's picture: a document being filled in, and the certificate a
 * course ends in — the two things the site makes, drawn rather than
 * photographed, so they're built from the same tokens as the real screens
 * and never go stale against them.
 *
 * Decorative in full. The names are sample data in a mock-up, not a claim
 * about any customer, and the whole block is hidden from screen readers —
 * the headline beside it already says what it shows.
 */
export function HeroVisual() {
  return (
    <div
      aria-hidden
      className="relative mx-auto w-full max-w-md select-none lg:max-w-none"
    >
      {/* Dot grid, faded out at the edges so it reads as texture, not a box. */}
      <div className="absolute -inset-8 bg-[radial-gradient(theme(colors.navy.200)_1px,transparent_1px)] [background-size:18px_18px] [mask-image:radial-gradient(closest-side,black,transparent)]" />

      {/* The document */}
      <div className="relative ml-auto w-[88%] rounded-card border border-line bg-surface p-6 shadow-overlay">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-control bg-primary-subtle text-primary">
              <Icon icon={FileText} />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">Rent Agreement</p>
              <p className="text-xs text-ink-subtle">Residential · 11 months</p>
            </div>
          </div>
          <span className="rounded-full bg-surface-sunken px-2.5 py-1 text-xs font-medium text-ink-muted">
            3 of 4
          </span>
        </div>

        <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-sunken">
          <div className="h-full w-3/4 rounded-full bg-brand" />
        </div>

        <dl className="mt-5 space-y-3">
          {FIELDS.map((field) => (
            <div key={field.label}>
              <dt className="text-xs font-medium text-ink-subtle">
                {field.label}
              </dt>
              <dd
                className={`mt-1 flex h-9 items-center justify-between rounded-control border px-3 text-sm ${
                  field.done
                    ? "border-line bg-surface text-ink"
                    : "border-primary bg-surface text-ink-subtle ring-4 ring-primary-subtle"
                }`}
              >
                {field.done ? field.value : "DD / MM / YYYY"}
                {field.done && (
                  <Icon
                    icon={CheckCircle2}
                    size="xs"
                    className="text-success"
                  />
                )}
              </dd>
            </div>
          ))}
        </dl>

        {/* Document body, suggested rather than written out */}
        <div className="mt-6 space-y-2 border-t border-line pt-5">
          <div className="h-2 w-full rounded-full bg-surface-sunken" />
          <div className="h-2 w-11/12 rounded-full bg-surface-sunken" />
          <div className="h-2 w-4/5 rounded-full bg-surface-sunken" />
        </div>
        <div className="mt-5 flex items-center gap-2 text-xs text-ink-subtle">
          <Icon icon={PenLine} size="xs" />
          <span className="h-px flex-1 bg-line-strong" />
          Signature
        </div>
      </div>

      {/* "Ready" chip, over the document's top-right corner */}
      <div className="absolute -top-5 right-4 flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-2 text-sm font-medium text-ink shadow-raised">
        <span className="grid h-5 w-5 place-items-center rounded-full bg-success-subtle text-success-text">
          <Icon icon={CheckCircle2} size="xs" />
        </span>
        Ready to sign · Word + PDF
      </div>

      {/* The certificate, overlapping bottom left. Gold on navy is 7.86:1 —
          the one pairing where the brand gold can carry text. */}
      <div className="absolute -bottom-10 left-0 w-60 rounded-card bg-primary p-5 text-ink-inverse shadow-overlay sm:w-64">
        <div className="flex items-center justify-between">
          <span className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-brand">
            Certificate
          </span>
          <Icon icon={BadgeCheck} size="md" className="text-brand" />
        </div>
        <p className="mt-3 font-display text-lg font-semibold leading-snug">
          GST for Freelancers
        </p>
        <p className="mt-1 text-xs text-ink-inverse-muted">
          Completed · Verified
        </p>
        <p className="mt-4 rounded-control bg-surface-inverse-raised px-2.5 py-1.5 font-mono text-[0.7rem] tracking-wider text-ink-inverse-muted">
          CODE 7F3A·91C2·D0E4
        </p>
      </div>
    </div>
  );
}
