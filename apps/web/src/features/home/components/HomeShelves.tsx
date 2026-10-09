"use client";

import { SkeletonCards } from "@pratikar/ui";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { useContentLibrary } from "@/features/content-library";
import { useTemplates } from "@/features/documents";
import { CourseCard, useCourses } from "@/features/lms";
import {
  CatalogueCard,
  CatalogueGrid,
} from "@/shared/components/CatalogueCard";
import { Icon } from "@/shared/components/Icon";
import {
  CONTENT_CATEGORY_LABELS,
  CONTENT_KIND,
  templateCategoryLabel,
} from "@/shared/lib/labels";

/** How many of each kind the home page shows before "View all". */
const SHELF_SIZE = 4;

/**
 * One row of the catalogue with a way into the rest of it.
 *
 * Renders nothing once loaded if the shelf is empty or the request failed: a
 * home page with a "couldn't load" box in the middle of it reads as broken,
 * and the section's own page says what went wrong if someone goes looking.
 */
function Shelf({
  eyebrow,
  title,
  description,
  href,
  linkLabel,
  isLoading,
  isEmpty,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  linkLabel: string;
  isLoading: boolean;
  isEmpty: boolean;
  children: ReactNode;
}) {
  if (!isLoading && isEmpty) return null;

  return (
    <section className="mx-auto max-w-shell px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.18em] text-gold-ink">
            <span aria-hidden className="h-px w-8 bg-current" />
            {eyebrow}
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink">
            {title}
          </h2>
          <p className="mt-2 text-base text-ink-muted">{description}</p>
        </div>
        <Link
          href={href}
          className="group inline-flex items-center gap-1.5 rounded-xl border border-line-strong bg-surface px-4 py-2.5 text-sm font-semibold text-primary shadow-card transition-colors hover:border-primary"
        >
          {linkLabel}
          <Icon
            icon={ArrowRight}
            className="transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none"
          />
        </Link>
      </div>
      <div className="mt-8">
        {isLoading ? (
          <SkeletonCards
            media={false}
            count={SHELF_SIZE}
            label={`Loading ${title.toLowerCase()}…`}
          />
        ) : (
          <CatalogueGrid>{children}</CatalogueGrid>
        )}
      </div>
    </section>
  );
}

export function TemplateShelf() {
  const { templates, isLoading, error } = useTemplates();
  return (
    <Shelf
      eyebrow="Ready templates"
      title="Popular documents"
      description="Answer a few questions, then pay and download."
      href="/documents"
      linkLabel="All documents"
      isLoading={isLoading}
      isEmpty={!!error || templates.length === 0}
    >
      {templates.slice(0, SHELF_SIZE).map((template) => (
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
    </Shelf>
  );
}

export function CourseShelf() {
  const { courses, isLoading, error } = useCourses();
  return (
    <Shelf
      eyebrow="Courses"
      title="Courses with a certificate"
      description="Video courses that end in a certificate with a code anyone can check — an employer, a client, or a registrar."
      href="/courses"
      linkLabel="All courses"
      isLoading={isLoading}
      isEmpty={!!error || courses.length === 0}
    >
      {courses.slice(0, SHELF_SIZE).map((course) => (
        <li key={course.id}>
          <CourseCard course={course} />
        </li>
      ))}
    </Shelf>
  );
}

export function LibraryShelf() {
  const { items, isLoading, error } = useContentLibrary();
  return (
    <Shelf
      eyebrow="The library"
      title="From the library"
      description="E-books, checklists and forms. Buy once and download whenever you need it."
      href="/content-library"
      linkLabel="Browse the library"
      isLoading={isLoading}
      isEmpty={!!error || items.length === 0}
    >
      {items.slice(0, SHELF_SIZE).map((item) => (
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
    </Shelf>
  );
}
