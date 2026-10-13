import type { ReactNode } from "react";

/**
 * The top of every page: what this is, in a sentence, and what you can do.
 *
 * Warm paper with a faint ruled grid and a gold glow — the same on every
 * page (catalogue, assistant, legal) so the site reads as one product, and
 * compact enough that what the page is *for* starts high on the screen.
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
    <section className="relative isolate mb-10 overflow-hidden border-b border-line bg-paper">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,theme(colors.navy.100/45%)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.navy.100/45%)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_70%_90%_at_85%_0%,black,transparent_75%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-32 -z-10 h-96 w-96 rounded-full bg-[radial-gradient(closest-side,rgb(212_175_55/0.18),transparent)]"
      />
      <div className="mx-auto max-w-shell px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl">
            {eyebrow && (
              <p className="eyebrow">
                <span aria-hidden className="h-px w-6 bg-current" />
                {eyebrow}
              </p>
            )}
            <h1 className="mt-3 text-4xl leading-[1.1] text-ink sm:text-5xl">
              {title}
            </h1>
            {description && (
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-muted sm:text-lg">
                {description}
              </p>
            )}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </div>
        {children && <div className="mt-6">{children}</div>}
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
