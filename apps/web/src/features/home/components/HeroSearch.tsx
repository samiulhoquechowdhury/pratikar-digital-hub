"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Icon } from "@/shared/components/Icon";

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
 * Larger than the one in the header, because on the home page it is the
 * primary action rather than a utility — the same reason Coursera and Udemy
 * repeat their search field in the hero instead of relying on the bar. Its
 * Search button is the page's one gold element above the fold.
 */
export function HeroSearch({
  tone = "light",
}: {
  /** "dark" on the navy hero banner: the field stays white, the chips invert. */
  tone?: "light" | "dark";
} = {}) {
  const dark = tone === "dark";
  const router = useRouter();
  const [query, setQuery] = useState("");

  const go = (term: string) =>
    router.push(`/search?q=${encodeURIComponent(term)}`);

  return (
    <div>
      <form
        role="search"
        className={`flex w-full max-w-2xl items-center gap-2 rounded-full border bg-surface p-1.5 pl-5 shadow-raised transition-colors ${
          dark
            ? "border-transparent focus-within:border-brand"
            : "border-line-strong focus-within:border-primary"
        }`}
        onSubmit={(event) => {
          event.preventDefault();
          const trimmed = query.trim();
          if (trimmed) go(trimmed);
        }}
      >
        <Icon icon={Search} size="md" className="text-ink-subtle" />
        <label htmlFor="hero-search" className="sr-only">
          Search documents, courses and guides
        </label>
        <input
          id="hero-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="What do you need? e.g. rent agreement"
          // No focus:outline-none — the global focus-visible outline stays;
          // see the note in SiteSearch.
          className="h-11 min-w-0 flex-1 bg-transparent text-base text-ink placeholder:text-ink-subtle"
        />
        <button
          type="submit"
          className="h-11 shrink-0 rounded-full bg-brand px-6 text-sm font-semibold text-on-brand transition-colors hover:bg-brand-hover"
        >
          Search
        </button>
      </form>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span
          className={`text-sm ${dark ? "text-ink-inverse-muted" : "text-ink-subtle"}`}
        >
          Popular:
        </span>
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => go(suggestion)}
            className={`rounded-full border px-3 py-1 text-sm transition-colors ${
              dark
                ? "border-line-inverse text-ink-inverse-muted hover:border-ink-inverse-muted hover:text-ink-inverse"
                : "border-line text-ink-muted hover:border-line-strong hover:text-ink"
            }`}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
