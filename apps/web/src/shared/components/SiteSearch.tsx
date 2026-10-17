"use client";

import { ArrowRight, Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useId, useState } from "react";

import { Icon } from "./Icon";

/**
 * The site search box. Submitting navigates to /search rather than filtering
 * in place, so a search is a real URL someone can bookmark, share, or reload.
 *
 * Two looks: `panel` is the header's large serif field on noir; `field` is a
 * plain input for light pages.
 */
export function SiteSearch({
  className = "",
  autoFocus = false,
  variant = "field",
  onSubmitted,
}: {
  className?: string;
  autoFocus?: boolean;
  variant?: "panel" | "field";
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
      {variant === "panel" ? (
        <div className="flex items-center gap-4 border-b border-ivory/25 pb-3 transition-colors focus-within:border-brand">
          <Icon icon={Search} size="lg" className="shrink-0 text-brand" />
          <input
            id={inputId}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            autoFocus={autoFocus}
            placeholder="What legal document do you need?"
            className="min-w-0 flex-1 bg-transparent font-display text-2xl font-light text-ivory placeholder:text-ivory/35 sm:text-4xl"
          />
          <button
            type="submit"
            className="grid h-12 w-12 shrink-0 place-items-center bg-gold-foil text-noir transition-transform hover:-translate-y-0.5"
          >
            <Icon icon={ArrowRight} size="md" label="Search" />
          </button>
        </div>
      ) : (
        <>
          <input
            id={inputId}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            autoFocus={autoFocus}
            placeholder="What legal document do you need?"
            // No `focus:outline-none`: the border change is the aesthetic
            // treatment; the global focus-visible outline is the
            // accessibility guarantee.
            className="h-12 w-full border border-ivory-line bg-surface pl-4 pr-14 text-sm text-ink placeholder:text-ink-subtle transition-colors hover:border-ink-subtle focus:border-noir"
          />
          <button
            type="submit"
            className="absolute right-1 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center bg-noir text-ivory transition-colors hover:bg-noir-raised"
          >
            <Icon icon={Search} size="sm" label="Search" />
          </button>
        </>
      )}
    </form>
  );
}
