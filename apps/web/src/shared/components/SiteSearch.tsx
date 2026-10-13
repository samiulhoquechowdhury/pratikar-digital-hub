"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useId, useState } from "react";

import { Icon } from "./Icon";

/**
 * The header search box. Submitting navigates to /search rather than filtering
 * in place, so a search is a real URL someone can bookmark, share, or reload.
 */
export function SiteSearch({
  className = "",
  autoFocus = false,
  onSubmitted,
}: {
  className?: string;
  autoFocus?: boolean;
  onSubmitted?: () => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Seeded from the URL so the box still shows the query after landing on
  // /search — an empty box next to a page of results reads like a bug.
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  // The header and the mobile menu both render one, so a fixed id would
  // appear twice and the second label would point at the first input.
  const inputId = useId();

  return (
    <form
      role="search"
      className={`relative ${className}`}
      onSubmit={(event) => {
        event.preventDefault();
        const trimmed = query.trim();
        if (!trimmed) return;
        router.push(`/search?q=${encodeURIComponent(trimmed)}`);
        onSubmitted?.();
      }}
    >
      <label htmlFor={inputId} className="sr-only">
        Search documents, courses and guides
      </label>
      <input
        id={inputId}
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        autoFocus={autoFocus}
        placeholder="What legal document do you need?"
        // No `focus:outline-none` here. The border change is the aesthetic
        // treatment; the global focus-visible outline is the accessibility
        // guarantee, and a component opting out of it is how keyboard
        // navigation quietly breaks.
        className="h-11 w-full rounded-full border border-line-strong bg-surface pl-5 pr-12 text-sm text-ink placeholder:text-ink-subtle transition-colors hover:border-ink-subtle focus:border-primary"
      />
      {/* Coursera's round button inside the field: the search is one tap
          on a phone, not a hunt for the keyboard's Go key. */}
      <button
        type="submit"
        className="absolute right-1 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-primary text-ink-inverse transition-colors hover:bg-primary-hover"
      >
        <Icon icon={Search} size="sm" label="Search" />
      </button>
    </form>
  );
}
