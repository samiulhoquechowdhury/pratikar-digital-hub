"use client";

import { CONTENT_CATEGORIES } from "@pratikar/types";
import {
  Alert,
  Badge,
  ButtonLink,
  Card,
  EmptyState,
  Field,
  Loading,
  Select,
} from "@pratikar/ui";
import { formatPaise } from "@pratikar/utils";
import Link from "next/link";
import { useState } from "react";

import { useAuth } from "@/shared/providers/AuthProvider";

import { useContentLibrary } from "../hooks/useContentLibrary";

/** SCREAMING_CASE enum values are not customer-facing copy. */
const CATEGORY_LABELS: Record<string, string> = {
  LEGAL_PRACTICE: "Legal practice",
  BUSINESS_COMPLIANCE: "Business & compliance",
  PROPERTY_DOCUMENTATION: "Property documentation",
  DIGITAL_CAREER: "Digital career",
  CHECKLISTS_REFERENCE: "Checklists & reference",
};

export function ContentLibraryList() {
  const { user } = useAuth();
  const [category, setCategory] = useState<string>("");
  const { items, isLoading, error } = useContentLibrary(
    category || undefined,
    !!user,
  );

  // The API requires a session to list the catalogue, so there's nothing to
  // show a visitor — same as templates.
  if (!user) {
    return (
      <EmptyState
        title="Sign in to browse the library"
        description="E-books and checklists are available to signed-in customers."
        action={<ButtonLink href="/login">Sign in</ButtonLink>}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="max-w-xs">
        <Field label="Category" htmlFor="category">
          <Select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">All categories</option>
            {CONTENT_CATEGORIES.map((value) => (
              <option key={value} value={value}>
                {CATEGORY_LABELS[value] ?? value}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {isLoading && <Loading />}
      {error && (
        <Alert tone="danger" role="alert">
          {error}
        </Alert>
      )}

      {!isLoading && !error && items.length === 0 && (
        <EmptyState
          title="Nothing here yet"
          description={
            category
              ? "No items published in this category. Try another one."
              : "New e-books and checklists appear here as they're published."
          }
        />
      )}

      {items.length > 0 && (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <li key={item.id}>
              <Card className="group flex h-full flex-col p-6 transition-shadow hover:shadow-raised">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg">
                    {/* Navy on hover, not gold: gold on white is 2.10:1 and
                        fails WCAG at any size (see the Tailwind preset). */}
                    <Link
                      href={`/content-library/${item.id}`}
                      className="text-ink transition-colors group-hover:text-primary"
                    >
                      {item.title}
                    </Link>
                  </h2>
                  <Badge tone="brand">
                    {item.type === "EBOOK" ? "E-book" : "Checklist"}
                  </Badge>
                </div>

                <p className="mt-2 flex-1 text-sm text-ink-muted">
                  {CATEGORY_LABELS[item.category] ?? item.category}
                </p>

                <div className="mt-5 border-t border-line pt-4">
                  <span className="text-lg font-semibold text-ink">
                    {formatPaise(item.priceInPaise)}
                  </span>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
