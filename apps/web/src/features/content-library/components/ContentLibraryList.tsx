"use client";

import { CONTENT_CATEGORIES } from "@pratikar/types";
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
      <p>
        <Link href="/login">Sign in</Link> to browse the content library.
      </p>
    );
  }

  return (
    <div>
      <label htmlFor="category">Category</label>
      <select
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
      </select>

      {isLoading && <p>Loading…</p>}
      {error && <p role="alert">{error}</p>}
      {!isLoading && !error && items.length === 0 && (
        <p>Nothing published in this category yet.</p>
      )}

      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <Link href={`/content-library/${item.id}`}>{item.title}</Link>{" "}
            <small>
              {item.type === "EBOOK" ? "E-book" : "Checklist"} ·{" "}
              {CATEGORY_LABELS[item.category] ?? item.category} ·{" "}
              {formatPaise(item.priceInPaise)}
            </small>
          </li>
        ))}
      </ul>
    </div>
  );
}
