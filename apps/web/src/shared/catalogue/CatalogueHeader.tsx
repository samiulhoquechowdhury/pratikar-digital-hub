import Link from "next/link";

/**
 * The top of a catalogue page, kept short so the search and results start
 * high on the screen — the old page intro cost a phone its first screen.
 *
 * The "Popular" searches double as examples of what to type, which a
 * placeholder can't show on a narrow screen without being cut off.
 */
export function CatalogueHeader({
  eyebrow,
  title,
  description,
  basePath,
  popular,
}: {
  eyebrow: string;
  title: string;
  description: string;
  /** The page the popular searches run on, e.g. "/content-library". */
  basePath: string;
  popular: string[];
}) {
  return (
    <section className="border-b border-line bg-surface-sunken">
      <div className="mx-auto max-w-shell px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <p className="text-sm font-semibold text-gold-ink">{eyebrow}</p>
        <h1 className="mt-2 text-3xl sm:text-4xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-muted">
          {description}
        </p>
        {popular.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="text-sm text-ink-muted">Popular:</span>
            {popular.map((term) => (
              <Link
                key={term}
                href={`${basePath}?q=${encodeURIComponent(term)}`}
                scroll={false}
                className="rounded-full border border-line-strong bg-surface px-3 py-1 text-sm text-ink transition-colors hover:border-primary hover:text-primary"
              >
                {term}
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
