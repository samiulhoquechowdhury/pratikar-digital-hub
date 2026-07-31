"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** Real examples, not placeholder nouns — they teach what the site can do. */
const SUGGESTIONS = [
  "rent agreement",
  "offer letter",
  "GST for freelancers",
  "property checklist",
];

/**
 * The hero search box.
 *
 * Larger and lighter than the one in the header, because on the home page it
 * is the primary action rather than a utility — the same reason Coursera and
 * Udemy repeat their search field in the hero instead of relying on the bar.
 */
export function HeroSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const go = (term: string) =>
    router.push(`/search?q=${encodeURIComponent(term)}`);

  return (
    <div>
      <form
        role="search"
        className="flex w-full max-w-xl gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const trimmed = query.trim();
          if (trimmed) go(trimmed);
        }}
      >
        <label htmlFor="hero-search" className="sr-only">
          Search documents, courses and guides
        </label>
        <input
          id="hero-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="What do you need? e.g. rent agreement"
          className="min-w-0 flex-1 rounded-control border border-transparent bg-surface px-4 py-3 text-base text-ink placeholder:text-ink-subtle focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/40"
        />
        <button
          type="submit"
          className="shrink-0 rounded-control bg-brand px-5 py-3 text-sm font-semibold text-on-brand transition-colors hover:bg-brand-hover"
        >
          Search
        </button>
      </form>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-ink-inverse-muted">
          Popular
        </span>
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => go(suggestion)}
            className="rounded-full border border-ink-inverse-muted/30 px-3 py-1 text-xs font-medium text-ink-inverse-muted transition-colors hover:border-brand hover:text-brand"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
