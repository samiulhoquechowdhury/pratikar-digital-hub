"use client";

import type { TemplateStatus } from "@pratikar/types";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  paiseToRupees,
  rupeesToPaise,
} from "@/features/templates/lib/fieldSchema";

import {
  CONTENT_CATEGORIES,
  CONTENT_TYPES,
  contentLibraryApi,
  type ContentCategory,
  type ContentItem,
  type ContentType,
} from "../api/contentLibraryApi";

const STATUSES: readonly TemplateStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];

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
    <form onSubmit={(e) => void handleSubmit(e)}>
      <div>
        <label htmlFor="title">Title</label>
        <input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="category">Category</label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value as ContentCategory)}
        >
          {CONTENT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="type">Type</label>
        <select
          id="type"
          value={type}
          onChange={(e) => setType(e.target.value as ContentType)}
        >
          {CONTENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="price">Price (₹)</label>
        <input
          id="price"
          inputMode="decimal"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="149"
        />
      </div>

      <div>
        <label htmlFor="fileUrl">File key</label>
        <input
          id="fileUrl"
          value={fileUrl}
          onChange={(e) => setFileUrl(e.target.value)}
          placeholder="content/gst-checklist.pdf"
        />
      </div>

      <div>
        <label htmlFor="status">Status</label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value as TemplateStatus)}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {error && <p role="alert">{error}</p>}

      <button type="submit" disabled={isSaving}>
        {isSaving ? "Saving…" : existing ? "Save changes" : "Create item"}
      </button>
    </form>
  );
}
