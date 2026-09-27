"use client";

import { Alert, ButtonLink, EmptyState, SkeletonCards } from "@pratikar/ui";
import { useSearchParams } from "next/navigation";
import type { ReactNode } from "react";

import { CourseCard } from "@/features/lms";
import {
  CatalogueCard,
  CatalogueGrid,
} from "@/shared/components/CatalogueCard";
import {
  CONTENT_CATEGORY_LABELS,
  CONTENT_KIND,
  templateCategoryLabel,
} from "@/shared/lib/labels";

import { useSiteSearch } from "../hooks/useSiteSearch";

function ResultGroup({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        {title}
        <span className="rounded-full bg-surface-sunken px-2 py-0.5 text-xs font-medium tabular-nums text-ink-subtle">
          {count}
        </span>
      </h2>
      <div className="mt-5">
        <CatalogueGrid>{children}</CatalogueGrid>
      </div>
    </section>
  );
}

/**
 * Results across the whole catalogue, grouped by kind and drawn with the
 * same cards as the catalogue pages — a result should look like the thing
 * you'll get when you click it.
 */
export function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const { results, total, isLoading, incomplete } = useSiteSearch(query);

  if (!query.trim()) {
    return (
      <EmptyState
        title="Search the catalogue"
        description="Look for a document template, a course, or a guide by name — or try a word like “checklist”."
      />
    );
  }

  if (isLoading)
    return <SkeletonCards media={false} label={`Searching for “${query}”…`} />;

  return (
    <div className="space-y-12">
      <p className="text-base text-ink-muted">
        {total === 0
          ? "No matches"
          : `${total} ${total === 1 ? "result" : "results"}`}{" "}
        for <span className="font-medium text-ink">“{query}”</span>
      </p>

      {incomplete && (
        <Alert tone="warning" role="status">
          Part of the catalogue couldn&apos;t be searched just now, so these
          results may be incomplete. Try again in a moment.
        </Alert>
      )}

      {results.templates.length > 0 && (
        <ResultGroup title="Documents" count={results.templates.length}>
          {results.templates.map((template) => (
            <li key={template.id}>
              <CatalogueCard
                href={`/documents/${template.id}`}
                kind="document"
                title={template.title}
                meta={[
                  templateCategoryLabel(template.category),
                  `${template.fieldSchema.length} questions`,
                ]}
                priceInPaise={template.priceInPaise}
              />
            </li>
          ))}
        </ResultGroup>
      )}

      {results.courses.length > 0 && (
        <ResultGroup title="Courses" count={results.courses.length}>
          {results.courses.map((course) => (
            <li key={course.id}>
              <CourseCard course={course} />
            </li>
          ))}
        </ResultGroup>
      )}

      {results.library.length > 0 && (
        <ResultGroup title="Library" count={results.library.length}>
          {results.library.map((item) => (
            <li key={item.id}>
              <CatalogueCard
                href={`/content-library/${item.id}`}
                kind={CONTENT_KIND[item.type]}
                title={item.title}
                meta={[CONTENT_CATEGORY_LABELS[item.category]]}
                priceInPaise={item.priceInPaise}
              />
            </li>
          ))}
        </ResultGroup>
      )}

      {total === 0 && (
        <EmptyState
          title={`Nothing matched “${query}”`}
          description="Try a shorter phrase, or browse the catalogue instead."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <ButtonLink href="/documents" variant="secondary">
                Documents
              </ButtonLink>
              <ButtonLink href="/courses" variant="secondary">
                Courses
              </ButtonLink>
              <ButtonLink href="/content-library" variant="secondary">
                Library
              </ButtonLink>
            </div>
          }
        />
      )}

      {total > 0 && (
        <p className="text-sm text-ink-subtle">
          Search matches titles, categories and types. Searching inside
          documents isn&apos;t available yet.
        </p>
      )}
    </div>
  );
}
