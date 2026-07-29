"use client";

import type {
  Template,
  TemplateFieldSchema,
  TemplateStatus,
} from "@pratikar/types";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { templatesApi } from "../api/templatesApi";
import {
  paiseToRupees,
  rupeesToPaise,
  validateFieldSchema,
} from "../lib/fieldSchema";

import { FieldSchemaEditor } from "./FieldSchemaEditor";

const STATUSES: readonly TemplateStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];

interface Props {
  /** Absent when creating. */
  existing?: Template;
}

export function TemplateForm({ existing }: Props) {
  const router = useRouter();

  const [title, setTitle] = useState(existing?.title ?? "");
  const [category, setCategory] = useState(existing?.category ?? "");
  const [price, setPrice] = useState(
    existing ? paiseToRupees(existing.priceInPaise) : "",
  );
  const [reviewPrice, setReviewPrice] = useState(
    existing ? paiseToRupees(existing.reviewPriceInPaise) : "",
  );
  const [status, setStatus] = useState<TemplateStatus>(
    existing?.status ?? "DRAFT",
  );
  const [schema, setSchema] = useState<TemplateFieldSchema>(
    existing?.fieldSchema ?? [],
  );

  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [problems, setProblems] = useState(
    [] as ReturnType<typeof validateFieldSchema>,
  );

  const schemaWideProblems = problems.filter((p) => p.index === null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const priceInPaise = rupeesToPaise(price);
    const reviewPriceInPaise = rupeesToPaise(reviewPrice);

    if (!title.trim() || !category.trim()) {
      setFormError("Title and category are required.");
      return;
    }
    if (priceInPaise === null || reviewPriceInPaise === null) {
      setFormError("Prices must be amounts of 0 or more, in rupees.");
      return;
    }

    const schemaProblems = validateFieldSchema(schema);
    setProblems(schemaProblems);
    if (schemaProblems.length > 0) {
      setFormError("Fix the field problems below before saving.");
      return;
    }

    // Publishing without an attached .docx would put a template in the
    // customer catalogue whose generation job fails on every attempt — the
    // worker throws "has no templateFileKey". Block it here; DRAFT is fine.
    if (status === "PUBLISHED" && !existing?.id) {
      setFormError(
        "Save as DRAFT first — a template can only be published once its .docx has been attached.",
      );
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        title: title.trim(),
        category: category.trim(),
        priceInPaise,
        reviewPriceInPaise,
        fieldSchema: schema,
        status,
      };

      const saved = existing
        ? await templatesApi.update(existing.id, payload)
        : await templatesApi.create(payload);

      router.push(`/templates/${saved.id}`);
      router.refresh();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Couldn't save the template.",
      );
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
          placeholder="Rent Agreement"
        />
      </div>

      <div>
        <label htmlFor="category">Category</label>
        <input
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="property"
        />
      </div>

      <div>
        <label htmlFor="price">Price (₹)</label>
        <input
          id="price"
          inputMode="decimal"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="199"
        />
      </div>

      <div>
        <label htmlFor="reviewPrice">Lawyer review price (₹)</label>
        <input
          id="reviewPrice"
          inputMode="decimal"
          value={reviewPrice}
          onChange={(e) => setReviewPrice(e.target.value)}
          placeholder="999"
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

      <FieldSchemaEditor
        schema={schema}
        problems={problems}
        onChange={setSchema}
      />

      {schemaWideProblems.length > 0 && (
        <ul role="alert">
          {schemaWideProblems.map((p, i) => (
            <li key={i}>{p.message}</li>
          ))}
        </ul>
      )}

      {formError && <p role="alert">{formError}</p>}

      <button type="submit" disabled={isSaving}>
        {isSaving ? "Saving…" : existing ? "Save changes" : "Create template"}
      </button>
    </form>
  );
}
