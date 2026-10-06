"use client";

import type { Template } from "@pratikar/types";
import { useMemo } from "react";

import {
  CatalogueBrowser,
  priceFacet,
  type FacetDef,
  type SortDef,
} from "@/shared/catalogue";
import { CatalogueCard } from "@/shared/components/CatalogueCard";
import { CatalogueRow } from "@/shared/components/CatalogueRow";
import { templateCategoryLabel } from "@/shared/lib/labels";

import { useTemplates } from "../hooks/useTemplates";

const SORTS: SortDef<Template>[] = [
  {
    id: "title",
    label: "Title A–Z",
    compare: (a, b) => a.title.localeCompare(b.title),
  },
  {
    id: "newest",
    label: "Newest first",
    compare: (a, b) => b.createdAt.localeCompare(a.createdAt),
  },
  {
    id: "price-asc",
    label: "Price: low to high",
    compare: (a, b) => a.priceInPaise - b.priceInPaise,
  },
  {
    id: "price-desc",
    label: "Price: high to low",
    compare: (a, b) => b.priceInPaise - a.priceInPaise,
  },
];

const questions = (template: Template) =>
  `${template.fieldSchema.length} ${template.fieldSchema.length === 1 ? "question" : "questions"}`;

/**
 * The template catalogue — open to visitors, since seeing what can be
 * generated is what persuades someone to make an account.
 *
 * Categories come from the templates themselves rather than a hardcoded list,
 * because the column is free text and a list here would silently hide any
 * template in a category nobody remembered to add.
 */
export function TemplateList({ initial }: { initial?: Template[] } = {}) {
  const { templates, isLoading, error } = useTemplates(initial);

  const facets = useMemo<FacetDef<Template>[]>(
    () => [
      {
        id: "category",
        label: "Category",
        options: Array.from(
          new Set(templates.map((t) => t.category).filter(Boolean)),
        )
          .sort((a, b) => a.localeCompare(b))
          .map((value) => ({ value, label: templateCategoryLabel(value) })),
        valuesOf: (template) => [template.category],
      },
      priceFacet((template) => template.priceInPaise),
    ],
    [templates],
  );

  const searchText = useMemo(
    () => (template: Template) =>
      `${template.title} ${templateCategoryLabel(template.category)}`,
    [],
  );
  const keyOf = useMemo(() => (template: Template) => template.id, []);

  return (
    <CatalogueBrowser
      items={templates}
      isLoading={isLoading}
      error={error}
      facets={facets}
      sorts={SORTS}
      searchText={searchText}
      searchPlaceholder="Search documents"
      noun={["document", "documents"]}
      keyOf={keyOf}
      renderRow={(template) => (
        <CatalogueRow
          href={`/documents/${template.id}`}
          kind="document"
          title={template.title}
          meta={[templateCategoryLabel(template.category), questions(template)]}
          priceInPaise={template.priceInPaise}
        />
      )}
      renderCard={(template) => (
        <CatalogueCard
          href={`/documents/${template.id}`}
          kind="document"
          title={template.title}
          meta={[templateCategoryLabel(template.category), questions(template)]}
          priceInPaise={template.priceInPaise}
        />
      )}
      emptyTitle="No templates published yet"
      emptyDescription="New templates appear here as they're reviewed and released."
    />
  );
}
