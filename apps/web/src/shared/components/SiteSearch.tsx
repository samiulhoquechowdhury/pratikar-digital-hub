"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

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
      <label htmlFor="site-search" className="sr-only">
        Search documents, courses and guides
      </label>
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-inverse-muted"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-3.5-3.5" />
      </svg>
      <input
        id="site-search"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        autoFocus={autoFocus}
        placeholder="Search documents, courses, guides"
        className="w-full rounded-full border border-line-inverse bg-surface-inverse-deep py-2 pl-10 pr-4 text-sm text-ink-inverse placeholder:text-ink-inverse-muted/70 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
      />
    </form>
  );
}
