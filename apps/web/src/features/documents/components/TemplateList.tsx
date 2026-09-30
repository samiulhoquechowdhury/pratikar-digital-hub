"use client";

import type { Template } from "@pratikar/types";
import { Alert, EmptyState, SkeletonCards } from "@pratikar/ui";
import { useMemo, useState } from "react";

import {
  CatalogueCard,
  CatalogueGrid,
} from "@/shared/components/CatalogueCard";
import {
  ALL,
  CatalogueToolbar,
  matchesQuery,
} from "@/shared/components/CatalogueToolbar";
import { templateCategoryLabel } from "@/shared/lib/labels";

import { useTemplates } from "../hooks/useTemplates";

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
  const [category, setCategory] = useState(ALL);
  const [query, setQuery] = useState("");

  const categories = useMemo(
    () =>
      Array.from(new Set(templates.map((t) => t.category).filter(Boolean)))
        .sort((a, b) => a.localeCompare(b))
        .map((value) => ({ value, label: templateCategoryLabel(value) })),
    [templates],
  );

  const visible = useMemo(
    () =>
      templates.filter(
        (template) =>
          (category === ALL || template.category === category) &&
          matchesQuery(template.title, query),
      ),
    [templates, category, query],
  );

  if (isLoading)
    return <SkeletonCards media={false} label="Loading templates…" />;
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
    <div className="space-y-8">
      <CatalogueToolbar
        query={query}
        onQueryChange={setQuery}
        searchLabel="Search templates"
        options={categories}
        selected={category}
        onSelect={setCategory}
        filterLabel="Category"
      />

      {visible.length === 0 ? (
        <EmptyState
          title="Nothing matched that"
          description="Try a shorter search, or choose All."
        />
      ) : (
        <CatalogueGrid>
          {visible.map((template) => (
            <li key={template.id}>
              <CatalogueCard
                href={`/documents/${template.id}`}
                kind="document"
                title={template.title}
                meta={[
                  templateCategoryLabel(template.category),
                  `${template.fieldSchema.length} ${
                    template.fieldSchema.length === 1 ? "question" : "questions"
                  }`,
                ]}
                priceInPaise={template.priceInPaise}
              />
            </li>
          ))}
        </CatalogueGrid>
      )}
    </div>
  );
}
