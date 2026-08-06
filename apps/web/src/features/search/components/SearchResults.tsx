"use client";

import { Alert, Badge, EmptyState, Loading } from "@pratikar/ui";
import { formatPaise } from "@pratikar/utils";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { CourseCard } from "@/features/lms";
import { useAuth } from "@/shared/providers/AuthProvider";

import { useSiteSearch } from "../hooks/useSiteSearch";

/** Shared row for the two catalogues that have no card of their own yet. */
function ResultRow({
  href,
  title,
  meta,
  price,
}: {
  href: string;
  title: string;
  meta: string;
  price: number;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-4 rounded-card border border-line bg-surface p-4 transition-shadow hover:shadow-raised"
    >
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-ink">
          {title}
        </span>
        <span className="mt-0.5 block text-xs text-ink-muted">{meta}</span>
      </span>
      <span className="shrink-0 text-sm font-semibold text-ink">
        {formatPaise(price)}
      </span>
    </Link>
  );
}

export function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const { user } = useAuth();
  const { results, total, isLoading, restricted } = useSiteSearch(query);

  if (!query.trim()) {
    return (
      <EmptyState
        title="Search the catalogue"
        description="Look for a document template, a course, or a guide by name."
      />
    );
  }

  if (isLoading) return <Loading label={`Searching for “${query}”…`} />;

  return (
    <div className="space-y-10">
      <p className="text-sm text-ink-muted">
        {total === 0
          ? "No matches"
          : `${total} ${total === 1 ? "result" : "results"}`}{" "}
        for <span className="font-medium text-ink">“{query}”</span>
      </p>

      {/* Templates and the library are behind sign-in, so a signed-out search
          is genuinely incomplete. Saying so is better than looking empty. */}
      {restricted && !user && (
        <Alert tone="info">
          You&apos;re seeing courses only. Document templates and the library
          need an account —{" "}
          <Link
            href={`/login?next=${encodeURIComponent(`/search?q=${query}`)}`}
            className="font-semibold underline"
          >
            sign in
          </Link>{" "}
          to search those too.
        </Alert>
      )}

      {results.courses.length > 0 && (
        <section>
          <h2 className="text-lg">Courses</h2>
          <ul className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {results.courses.map((course) => (
              <li key={course.id}>
                <CourseCard course={course} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {results.templates.length > 0 && (
        <section>
          <h2 className="text-lg">Document templates</h2>
          <ul className="mt-4 space-y-3">
            {results.templates.map((template) => (
              <li key={template.id}>
                <ResultRow
                  href={`/documents/${template.id}`}
                  title={template.title}
                  meta={template.category}
                  price={template.priceInPaise}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {results.library.length > 0 && (
        <section>
          <h2 className="text-lg">Library</h2>
          <ul className="mt-4 space-y-3">
            {results.library.map((item) => (
              <li key={item.id}>
                <ResultRow
                  href={`/content-library/${item.id}`}
                  title={item.title}
                  meta={`${item.type === "EBOOK" ? "E-book" : "Checklist"} · ${item.category.replaceAll("_", " ").toLowerCase()}`}
                  price={item.priceInPaise}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {total === 0 && (
        <EmptyState
          title={`Nothing matched “${query}”`}
          description="Try a shorter phrase, or browse the catalogue instead."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Link
                href="/documents"
                className="rounded-control border border-line-strong px-4 py-2 text-sm font-semibold text-ink hover:bg-surface-sunken"
              >
                All templates
              </Link>
              <Link
                href="/courses"
                className="rounded-control border border-line-strong px-4 py-2 text-sm font-semibold text-ink hover:bg-surface-sunken"
              >
                All courses
              </Link>
            </div>
          }
        />
      )}

      {total > 0 && (
        <p className="text-xs text-ink-subtle">
          <Badge>Beta</Badge>{" "}
          <span className="ml-1">
            Search matches on titles and categories. Full-text search across
            document contents is not available yet.
          </span>
        </p>
      )}
    </div>
  );
}
