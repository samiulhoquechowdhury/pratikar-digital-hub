"use client";

import type { TemplateStatus } from "@pratikar/types";
import { Alert, Button, Field, Input, Select } from "@pratikar/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  paiseToRupees,
  rupeesToPaise,
} from "@/features/templates/lib/fieldSchema";
import {
  FormActions,
  FormGrid,
  FormRowFull,
  FormSection,
} from "@/shared/components/FormLayout";

import {
  CONTENT_CATEGORIES,
  CONTENT_TYPES,
  contentLibraryApi,
  type ContentCategory,
  type ContentItem,
  type ContentType,
} from "../api/contentLibraryApi";

const STATUSES: readonly TemplateStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];

/** SCREAMING_CASE enum values aren't reading material, even for staff. */
const CATEGORY_LABELS: Record<string, string> = {
  LEGAL_PRACTICE: "Legal practice",
  BUSINESS_COMPLIANCE: "Business & compliance",
  PROPERTY_DOCUMENTATION: "Property documentation",
  DIGITAL_CAREER: "Digital career",
  CHECKLISTS_REFERENCE: "Checklists & reference",
};

export function ContentItemForm({ existing }: { existing?: ContentItem }) {
  const router = useRouter();

  const [title, setTitle] = useState(existing?.title ?? "");
  const [category, setCategory] = useState<ContentCategory>(
    existing?.category ?? "LEGAL_PRACTICE",
  );
  const [type, setType] = useState<ContentType>(existing?.type ?? "EBOOK");
  const [price, setPrice] = useState(
    existing ? paiseToRupees(existing.priceInPaise) : "",
  );
  const [fileUrl, setFileUrl] = useState(existing?.fileUrl ?? "");
  const [status, setStatus] = useState<TemplateStatus>(
    existing?.status ?? "DRAFT",
  );

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const priceInPaise = rupeesToPaise(price);
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (priceInPaise === null) {
      setError("Price must be an amount of 0 or more, in rupees.");
      return;
    }
    // fileUrl is the storage key the customer's download resolves to. A
    // PUBLISHED item without one is purchasable but undeliverable, so block
    // that combination rather than discovering it at download time.
    if (!fileUrl.trim()) {
      setError(
        "A file key is required — customers download this after paying.",
      );
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        title: title.trim(),
        category,
        type,
        priceInPaise,
        fileUrl: fileUrl.trim(),
        status,
      };
      const saved = existing
        ? await contentLibraryApi.update(existing.id, payload)
        : await contentLibraryApi.create(payload);

      router.push(`/content-library/${saved.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save the item.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
      <FormSection
        title="Item details"
        description="What customers see in the library listing."
      >
        <FormGrid>
          <FormRowFull>
            <Field label="Title" htmlFor="title">
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="GST filing checklist for freelancers"
              />
            </Field>
          </FormRowFull>

          <Field label="Category" htmlFor="category">
            <Select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value as ContentCategory)}
            >
              {CONTENT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c] ?? c}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Type" htmlFor="type">
            <Select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value as ContentType)}
            >
              {CONTENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t === "EBOOK" ? "E-book" : "Checklist"}
                </option>
              ))}
            </Select>
          </Field>
        </FormGrid>
      </FormSection>

      <FormSection
        title="Price and file"
        description="GST is added at checkout — enter the price before tax."
      >
        <FormGrid>
          <Field label="Price (₹)" htmlFor="price">
            <Input
              id="price"
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="149"
            />
          </Field>

          <Field
            label="File key"
            htmlFor="fileUrl"
            hint="Storage key, not a URL. This is what a paying customer downloads."
          >
            <Input
              id="fileUrl"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              placeholder="content/gst-checklist.pdf"
            />
          </Field>
        </FormGrid>
      </FormSection>

      <FormSection
        title="Publishing"
        description="PUBLISHED puts this in the customer catalogue immediately."
      >
        <div className="max-w-xs">
          <Field label="Status" htmlFor="status">
            <Select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as TemplateStatus)}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </FormSection>

      {error && (
        <Alert tone="danger" role="alert">
          {error}
        </Alert>
      )}

      <FormActions>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Saving…" : existing ? "Save changes" : "Create item"}
        </Button>
        <Link
          href="/content-library"
          className="text-sm font-medium text-ink-muted hover:text-ink"
        >
          Cancel
        </Link>
      </FormActions>
    </form>
  );
}
