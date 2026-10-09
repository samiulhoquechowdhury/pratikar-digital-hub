import type { ReactNode } from "react";

/**
 * The top of every page: what this is, in a sentence, and what you can do.
 *
 * A tinted band, the same on every page — catalogue, assistant, legal — so
 * the site reads as one product, and kept compact so what the page is *for*
 * starts high on the screen rather than below a screenful of heading.
 *
 * Web-only on purpose. The shared PageHeader in @pratikar/ui is also the
 * admin panel's, and a storefront title wants more presence than a tool's.
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
  /** Anything that belongs under the description: popular searches, tabs. */
  children?: ReactNode;
}) {
  return (
    <section className="mb-8 border-b border-line bg-surface-sunken">
      <div className="mx-auto max-w-shell px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            {eyebrow && (
              <p className="text-sm font-semibold text-gold-ink">{eyebrow}</p>
            )}
            <h1 className="mt-2 text-3xl sm:text-4xl">{title}</h1>
            {description && (
              <p className="mt-3 text-base leading-relaxed text-ink-muted sm:text-lg">
                {description}
              </p>
            )}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </div>
        {children && <div className="mt-5">{children}</div>}
      </div>
    </section>
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
