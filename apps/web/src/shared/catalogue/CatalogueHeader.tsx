import Link from "next/link";

import { PageIntro } from "../components/PageIntro";

/**
 * A catalogue page's header: the shared page band, plus popular searches.
 *
 * The popular searches double as examples of what to type, which a
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
    <PageIntro eyebrow={eyebrow} title={title} description={description}>
      {popular.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
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
    </PageIntro>
  );
}
