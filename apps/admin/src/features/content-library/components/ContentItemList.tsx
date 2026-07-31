"use client";

import {
  Alert,
  Badge,
  ButtonLink,
  EmptyState,
  Loading,
  TBody,
  TD,
  TH,
  THead,
  TR,
  Table,
} from "@pratikar/ui";
import Link from "next/link";
import { useEffect, useState } from "react";

import { paiseToRupees } from "@/features/templates/lib/fieldSchema";

import { contentLibraryApi, type ContentItem } from "../api/contentLibraryApi";

/** DRAFT and ARCHIVED aren't purchasable; PUBLISHED is. Make that obvious. */
const STATUS_TONE = {
  PUBLISHED: "success",
  DRAFT: "warning",
  ARCHIVED: "neutral",
} as const;

/** SCREAMING_CASE enum values aren't reading material. */
const CATEGORY_LABELS: Record<string, string> = {
  LEGAL_PRACTICE: "Legal practice",
  BUSINESS_COMPLIANCE: "Business & compliance",
  PROPERTY_DOCUMENTATION: "Property documentation",
  DIGITAL_CAREER: "Digital career",
  CHECKLISTS_REFERENCE: "Checklists & reference",
};

export function ContentItemList() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    contentLibraryApi
      .listAll()
      .then((result) => {
        if (!cancelled) setItems(result);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load the content library.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) return <Loading label="Loading content library…" />;
  if (error) {
    return (
      <Alert tone="danger" role="alert">
        {error}
      </Alert>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="No content items yet"
        description="E-books and checklists customers buy individually and download."
        action={
          <ButtonLink href="/content-library/new">Create an item</ButtonLink>
        }
      />
    );
  }

  return (
    <Table>
      <THead>
        <TR>
          <TH>Title</TH>
          <TH>Category</TH>
          <TH>Type</TH>
          <TH align="right">Price</TH>
          <TH>Status</TH>
          <TH align="right">
            <span className="sr-only">Actions</span>
          </TH>
        </TR>
      </THead>
      <TBody>
        {items.map((item) => (
          <TR key={item.id}>
            <TD>
              <Link
                href={`/content-library/${item.id}`}
                className="font-medium text-ink hover:text-primary"
              >
                {item.title}
              </Link>
            </TD>
            <TD muted>{CATEGORY_LABELS[item.category] ?? item.category}</TD>
            <TD muted>{item.type === "EBOOK" ? "E-book" : "Checklist"}</TD>
            <TD align="right">₹{paiseToRupees(item.priceInPaise)}</TD>
            <TD>
              <Badge tone={STATUS_TONE[item.status]}>{item.status}</Badge>
            </TD>
            <TD align="right">
              <Link
                href={`/content-library/${item.id}`}
                className="text-sm font-semibold text-primary hover:text-primary-hover"
              >
                Edit
              </Link>
            </TD>
          </TR>
        ))}
      </TBody>
    </Table>
  );
}
