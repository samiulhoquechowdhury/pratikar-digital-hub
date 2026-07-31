"use client";

import {
  Alert,
  Badge,
  ButtonLink,
  EmptyState,
  Input,
  Loading,
} from "@pratikar/ui";
import { formatPaise, grossPaise } from "@pratikar/utils";
import Link from "next/link";
import { useMemo, useState } from "react";

import { useAuth } from "@/shared/providers/AuthProvider";

import { useTemplates } from "../hooks/useTemplates";

/**
 * Category is a free-text column — the taxonomy is still open (docs/srs.md
 * Section 8, item 2) — so the filter is built from whatever the catalogue
 * actually contains rather than from a hardcoded list that would silently
 * drop templates in a category nobody remembered to add here.
 */
const ALL = "__all__";

export function TemplateList() {
  const { user } = useAuth();
  const { templates, isLoading, error } = useTemplates(!!user);
  const [category, setCategory] = useState(ALL);
  const [query, setQuery] = useState("");

  const categories = useMemo(
    () =>
      Array.from(
        new Set(templates.map((t) => t.category).filter(Boolean)),
      ).sort((a, b) => a.localeCompare(b)),
    [templates],
  );

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return templates.filter(
      (template) =>
        (category === ALL || template.category === category) &&
        (!needle || template.title.toLowerCase().includes(needle)),
    );
  }, [templates, category, query]);

  if (!user) {
    return (
      <EmptyState
        title="Sign in to browse templates"
        description="Templates are available to signed-in customers. Creating an account takes one code sent to your email."
        action={<ButtonLink href="/login?next=/documents">Sign in</ButtonLink>}
      />
    );
  }

  if (isLoading) return <Loading label="Loading templates…" />;

  if (error) {
    return (
      <Alert tone="danger" role="alert">
        {error}
      </Alert>
    );
  }

  if (templates.length === 0) {
    return (
      <EmptyState
        title="No templates published yet"
        description="New templates appear here as they're reviewed and released."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-full max-w-xs">
          <label htmlFor="template-search" className="sr-only">
            Search templates
          </label>
          <Input
            id="template-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search templates"
          />
        </div>

        {categories.length > 1 && (
          // Chips rather than a select: there are few enough categories to
          // show them all, and seeing the whole set is half of browsing.
          <div className="flex flex-wrap gap-2">
            {[ALL, ...categories].map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={category === value}
                onClick={() => setCategory(value)}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                  category === value
                    ? "border-primary bg-primary text-ink-inverse"
                    : "border-line-strong bg-surface text-ink-muted hover:bg-surface-sunken"
                }`}
              >
                {value === ALL ? "All" : value}
              </button>
            ))}
          </div>
        )}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title="Nothing matched that"
          description="Try a shorter search, or clear the category filter."
        />
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((template) => (
            <li key={template.id}>
              <article className="group flex h-full flex-col rounded-card border border-line bg-surface p-6 shadow-card transition-shadow hover:shadow-raised">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg">
                    {/* Navy on hover, never gold — gold on white is 2.10:1. */}
                    <Link
                      href={`/documents/${template.id}`}
                      className="text-ink transition-colors group-hover:text-primary"
                    >
                      {template.title}
                    </Link>
                  </h2>
                  {template.category && (
                    <Badge tone="brand">{template.category}</Badge>
                  )}
                </div>

                <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">
                  {template.fieldSchema.length}{" "}
                  {template.fieldSchema.length === 1 ? "question" : "questions"}{" "}
                  to answer. You&apos;ll get a Word file and a PDF.
                </p>

                <div className="mt-5 flex items-baseline justify-between border-t border-line pt-4">
                  {/* GST-inclusive, matching what the buy button will charge —
                      quoting the bare price here would understate the total. */}
                  <span className="text-lg font-semibold text-ink">
                    {formatPaise(grossPaise(template.priceInPaise))}
                  </span>
                  <span className="text-xs text-ink-subtle">incl. GST</span>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
