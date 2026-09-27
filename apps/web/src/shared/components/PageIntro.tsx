import type { ReactNode } from "react";

/**
 * The top of every page: what this is, in a sentence, and what you can do.
 *
 * Web-only on purpose. The shared PageHeader in @pratikar/ui is also the
 * admin panel's, and a storefront title wants more air than a tool does.
 */
export function PageIntro({
  eyebrow,
  title,
  description,
  actions,
  children,
}: {
  /** A short label above the title — the section, or the kind of thing. */
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  /** Anything that belongs under the description: tabs, filters, a search. */
  children?: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-shell px-4 pb-8 pt-12 sm:px-6 sm:pt-16 lg:px-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          {eyebrow && (
            <p className="text-sm font-medium text-primary">{eyebrow}</p>
          )}
          <h1 className="mt-2 text-4xl sm:text-5xl">{title}</h1>
          {description && (
            <p className="mt-4 text-lg leading-relaxed text-ink-muted">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
      {children && <div className="mt-8">{children}</div>}
    </div>
  );
}

/** The page's working width, lined up with PageIntro above it. */
export function PageSection({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`mx-auto max-w-shell px-4 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  );
}
