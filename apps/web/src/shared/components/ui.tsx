import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

/**
 * Local UI primitives.
 *
 * These live in apps/web rather than packages/ui on purpose: nothing in
 * apps/admin uses them yet, and packages/ui's own note says not to pre-build a
 * component library speculatively. Promote a component there the first time
 * admin needs the same thing — at that point it's shared, not a guess.
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

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ComponentPropsWithoutRef<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return (
    <button className={buttonClass(variant, size, className)} {...props} />
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

/* ----------------------------------------------------------------- loading */

/** Loading copy is announced politely so it isn't silent for screen readers. */
export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <p role="status" className="text-sm text-ink-muted">
      {label}
    </p>
  );
}
