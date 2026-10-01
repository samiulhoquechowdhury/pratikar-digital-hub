"use client";

import { Search } from "lucide-react";
import { useId } from "react";

import { Icon } from "./Icon";

export const ALL = "__all__";

/**
 * Search and a row of filter chips — the one filtering pattern every
 * catalogue uses, so a visitor learns it once.
 *
 * Chips rather than a select: there are few enough options to show them all,
 * and seeing the whole set is half of browsing.
 */
export function CatalogueToolbar({
  query,
  onQueryChange,
  searchLabel,
  options,
  selected,
  onSelect,
  filterLabel,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  /** Accessible name and placeholder, e.g. "Search templates". */
  searchLabel: string;
  /** Filter values and their display labels. ALL is added in front. */
  options: { value: string; label: string }[];
  selected: string;
  onSelect: (value: string) => void;
  /** Names the chip group for screen readers, e.g. "Category". */
  filterLabel: string;
}) {
  const inputId = useId();

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      {options.length > 1 ? (
        <div
          role="group"
          aria-label={filterLabel}
          className="flex flex-wrap gap-2"
        >
          {[{ value: ALL, label: "All" }, ...options].map((option) => {
            const active = selected === option.value;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={active}
                onClick={() => onSelect(option.value)}
                className={`h-9 rounded-full border px-4 text-sm font-medium transition-colors ${
                  active
                    ? "border-primary bg-primary text-ink-inverse"
                    : "border-line bg-surface text-ink-muted hover:border-line-strong hover:text-ink"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      ) : (
        <span />
      )}

      <div className="relative w-full lg:w-72">
        <label htmlFor={inputId} className="sr-only">
          {searchLabel}
        </label>
        <Icon
          icon={Search}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle"
        />
        <input
          id={inputId}
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={searchLabel}
          className="h-10 w-full rounded-full border border-line bg-surface pl-9 pr-4 text-sm text-ink placeholder:text-ink-subtle transition-colors hover:border-line-strong focus:border-line-strong"
        />
      </div>
    </div>
  );
}

/** Case-insensitive title match, shared so every search behaves the same. */
export const matchesQuery = (title: string, query: string) =>
  title.toLowerCase().includes(query.trim().toLowerCase());
