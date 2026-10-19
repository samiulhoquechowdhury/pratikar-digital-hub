import type { ReactNode } from "react";

/**
 * The top of every page: what this is, in a sentence, and what you can do.
 *
 * A tinted banner like the home page's hero slides — a tag, a bold title,
 * one line — the same on every page (catalogue, assistant, legal) so the
 * site reads as one product.
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
    <section className="relative isolate mb-10 overflow-hidden bg-banner-sky">
      {/* The home banners' shapes: a white disc and a gold one, off the
          right edge — so every page opens like a slide from the hero. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 -z-10 h-80 w-80 rounded-full bg-white/70 sm:h-[26rem] sm:w-[26rem]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-16 right-40 -z-10 hidden h-40 w-40 rounded-full bg-brand/20 sm:block"
      />
      <div className="mx-auto max-w-shell px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl">
            {eyebrow && (
              <p className="inline-flex rounded bg-noir px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-white">
                {eyebrow}
              </p>
            )}
            <h1 className="mt-4 text-[2.25rem] font-extrabold leading-tight text-noir sm:text-[2.75rem]">
              {title}
            </h1>
            {description && (
              <p className="mt-3 max-w-2xl text-lg leading-relaxed text-noir/75">
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
