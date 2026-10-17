import type { ReactNode } from "react";

/**
 * The top of every page: what this is, in a sentence, and what you can do.
 *
 * Ivory with fine vertical rules, a gold hairline and a large light serif
 * title — the same on every page (catalogue, assistant, legal) so the site
 * reads as one house.
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
    <section className="relative isolate mb-12 overflow-hidden border-b border-ivory-line bg-ivory">
      {/* Fine vertical rules — the hero's columns, on ivory. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgb(6_12_23/0.05)_1px,transparent_1px)] [background-size:calc(100%/12)_100%] [mask-image:linear-gradient(to_bottom,black,transparent)]"
      />
      <div className="mx-auto max-w-shell px-4 pb-12 pt-14 sm:px-6 sm:pb-16 sm:pt-20 lg:px-8">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl">
            {eyebrow && (
              <p className="flex items-center gap-4">
                <span aria-hidden className="h-px w-10 bg-gold-foil" />
                <span className="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-noir/55">
                  {eyebrow}
                </span>
              </p>
            )}
            <h1 className="mt-6 text-5xl font-light leading-[1.02] text-noir sm:text-6xl lg:text-7xl">
              {title}
            </h1>
            {description && (
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-noir/65">
                {description}
              </p>
            )}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </div>
        {children && <div className="mt-8">{children}</div>}
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
