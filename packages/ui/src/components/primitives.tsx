import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

/**
 * Shared design-system primitives for apps/web and apps/admin.
 *
 * These started life in apps/web and moved here the moment admin needed the
 * same things — which is the bar packages/ui set for itself: promote on the
 * second real use, not on speculation.
 *
 * Every colour here is a semantic token from
 * packages/config/tailwind-preset.js. Never a raw palette step, and never a
 * hex — that's what keeps the two apps from drifting apart visually, and what
 * makes a palette change a one-file edit.
 */

/* ------------------------------------------------------------------ button */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md";

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 rounded-control font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  // Gold with near-black text (8.44:1). White on gold would fail, so the
  // foreground here is `on-brand`, never `ink-inverse`.
  primary: "bg-brand text-on-brand hover:bg-brand-hover",
  secondary:
    "border border-line-strong bg-surface text-ink hover:bg-surface-sunken",
  // Gold is unreadable as text on light surfaces, so the quiet variant leans
  // on brand navy rather than a washed-out gold.
  ghost: "text-primary hover:bg-primary-subtle",
  danger: "bg-danger text-ink-inverse hover:bg-danger-hover",
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-5 py-2.5 text-sm",
};

const buttonClass = (variant: ButtonVariant, size: ButtonSize, extra = "") =>
  `${BUTTON_BASE} ${BUTTON_VARIANTS[variant]} ${BUTTON_SIZES[size]} ${extra}`.trim();

/**
 * Spinner shown while a button is working. `currentColor` so it inherits the
 * variant's foreground and needs no per-variant styling.
 */
function Spinner() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className="h-4 w-4 shrink-0 animate-spin motion-reduce:animate-none"
    >
      <circle
        cx="8"
        cy="8"
        r="6.5"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="2.5"
      />
      <path
        d="M8 1.5A6.5 6.5 0 0 1 14.5 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * `loading` replaces the hand-written `{busy ? "Saving…" : "Save"}` that had
 * grown into eleven copies. Three things it gets right that the string swap
 * did not:
 *
 *   the button keeps its own label, so it doesn't change width mid-click and
 *   shift whatever sits beside it;
 *   it is disabled while loading, so a double click can't fire twice;
 *   `aria-busy` plus a live message says what is happening, where a changed
 *   label only says it to people who can see it.
 *
 * Pass `loadingLabel` when the work has a name worth announcing ("Saving…").
 */
export function Button({
  variant = "primary",
  size = "md",
  className = "",
  loading = false,
  loadingLabel,
  disabled,
  children,
  ...props
}: ComponentPropsWithoutRef<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingLabel?: string;
}) {
  return (
    <button
      className={buttonClass(variant, size, className)}
      aria-busy={loading || undefined}
      disabled={disabled ?? loading}
      {...props}
    >
      {loading && <Spinner />}
      {children}
      {loading && loadingLabel && (
        <span role="status" className="sr-only">
          {loadingLabel}
        </span>
      )}
    </button>
  );
}

/* ------------------------------------------------------------- icon button */

/**
 * The small square control for reorder arrows and row removal.
 *
 * Promoted from a copy-pasted `ICON_BUTTON` class string that had drifted
 * between the quiz editor and the field-schema editor. `label` is required and
 * becomes the accessible name — these buttons render a bare glyph, so without
 * it a screen reader announces "button" and nothing else.
 */
export function IconButton({
  label,
  tone = "neutral",
  className = "",
  children,
  ...props
}: ComponentPropsWithoutRef<"button"> & {
  label: string;
  tone?: "neutral" | "danger";
}) {
  const tones = {
    neutral:
      "border-line-strong bg-surface text-ink-muted hover:bg-surface-sunken",
    danger:
      "border-danger-border bg-surface text-danger-text hover:bg-danger-subtle",
  };
  return (
    <button
      type="button"
      className={`inline-flex h-7 w-7 items-center justify-center rounded-control border text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${tones[tone]} ${className}`}
      {...props}
    >
      <span className="sr-only">{label}</span>
      <span aria-hidden>{children}</span>
    </button>
  );
}

/** Same look as Button, but renders an anchor — use for navigation, not actions. */
export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className = "",
  children,
}: {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={buttonClass(variant, size, className)}>
      {children}
    </Link>
  );
}

/* -------------------------------------------------------------------- card */

export function Card({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`rounded-card border border-line bg-surface shadow-card ${className}`}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------- page header */

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="border-b border-line bg-surface">
      <div className="mx-auto max-w-shell px-4 py-10 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-end sm:justify-between sm:gap-6">
          <div>
            <h1 className="text-3xl">{title}</h1>
            {description && (
              <p className="mt-2 max-w-prose text-base text-ink-muted">
                {description}
              </p>
            )}
          </div>
          {actions && <div className="mt-4 shrink-0 sm:mt-0">{actions}</div>}
        </div>
      </div>
    </div>
  );
}

/** Standard page body width, so every screen lines up with the header above. */
export function PageBody({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`mx-auto max-w-shell px-4 py-10 sm:px-6 lg:px-8 ${className}`}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------- alert */

type AlertTone = "info" | "success" | "warning" | "danger";

const ALERT_TONES: Record<AlertTone, string> = {
  info: "border-primary-border bg-primary-subtle text-ink",
  success: "border-success-border bg-success-subtle text-success-text",
  warning: "border-warning-border bg-warning-subtle text-warning-text",
  danger: "border-danger-border bg-danger-subtle text-danger-text",
};

/**
 * `role` is a prop rather than derived from tone: a validation error needs
 * role="alert" so it's announced, but a static warning shouldn't interrupt
 * whatever a screen reader is already saying.
 */
export function Alert({
  tone = "info",
  role,
  children,
}: {
  tone?: AlertTone;
  role?: "alert" | "status";
  children: ReactNode;
}) {
  return (
    <div
      role={role}
      className={`rounded-card border px-4 py-3 text-sm leading-relaxed ${ALERT_TONES[tone]}`}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------- badge */

type BadgeTone = "neutral" | "brand" | "success" | "warning" | "danger";

const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: "bg-surface-sunken text-ink-muted",
  brand: "bg-brand-subtle text-gold-ink",
  success: "bg-success-subtle text-success-text",
  warning: "bg-warning-subtle text-warning-text",
  danger: "bg-danger-subtle text-danger-text",
};

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: BadgeTone;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${BADGE_TONES[tone]}`}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------- empty state */

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <Card className="px-6 py-12 text-center">
      <p className="text-base font-semibold text-ink">{title}</p>
      {description && (
        <p className="mx-auto mt-2 max-w-prose text-sm text-ink-muted">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </Card>
  );
}

/* ------------------------------------------------------------------- forms */

const CONTROL =
  "w-full rounded-control border border-line-strong bg-surface px-3 py-2 text-base text-ink placeholder:text-ink-subtle disabled:bg-surface-sunken";

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-ink">
        {label}
      </label>
      {hint && <p className="mt-1 text-sm text-ink-subtle">{hint}</p>}
      <div className="mt-1.5">{children}</div>
      {error && (
        <p className="mt-1.5 text-sm text-danger-text" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function Input({
  className = "",
  ...props
}: ComponentPropsWithoutRef<"input">) {
  return <input className={`${CONTROL} ${className}`} {...props} />;
}

export function Select({
  className = "",
  ...props
}: ComponentPropsWithoutRef<"select">) {
  return <select className={`${CONTROL} ${className}`} {...props} />;
}

/**
 * Four rows by default. Template fields that use a textarea are things like
 * addresses and recitals — a two-row box makes them look like an afterthought
 * and hides what the person has already typed.
 */
export function Textarea({
  className = "",
  rows = 4,
  ...props
}: ComponentPropsWithoutRef<"textarea">) {
  return (
    <textarea rows={rows} className={`${CONTROL} ${className}`} {...props} />
  );
}

/* ----------------------------------------------------------------- loading */

/** Loading copy is announced politely so it isn't silent for screen readers. */
export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <p role="status" className="text-sm text-ink-muted">
      {label}
    </p>
  );
}
