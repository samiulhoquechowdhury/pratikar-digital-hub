"use client";

import type {
  Template,
  TemplateFieldSchema,
  TemplateStatus,
} from "@pratikar/types";
import { Alert, Button, Card, Field, Input, Select } from "@pratikar/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  FormActions,
  FormGrid,
  FormRowFull,
  FormSection,
} from "@/shared/components/FormLayout";

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
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
      <FormSection
        title="Template details"
        description="What customers see in the catalogue before they start filling it in."
      >
        <FormGrid>
          <Field label="Title" htmlFor="title">
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Rent Agreement"
            />
          </Field>

          <Field
            label="Category"
            htmlFor="category"
            hint="Free text for now — it groups templates in the customer catalogue."
          >
            <Input
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="property"
            />
          </Field>
        </FormGrid>
      </FormSection>

      <FormSection
        title="Pricing"
        description="Both prices exclude GST, which is added at checkout."
      >
        <FormGrid>
          <Field label="Price (₹)" htmlFor="price">
            <Input
              id="price"
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="199"
            />
          </Field>

          <Field
            label="Lawyer review price (₹)"
            htmlFor="reviewPrice"
            hint="Bought separately from the document itself."
          >
            <Input
              id="reviewPrice"
              inputMode="decimal"
              value={reviewPrice}
              onChange={(e) => setReviewPrice(e.target.value)}
              placeholder="999"
            />
          </Field>
        </FormGrid>
      </FormSection>

      <Card className="p-6">
        <FieldSchemaEditor
          schema={schema}
          problems={problems}
          onChange={setSchema}
        />

        {schemaWideProblems.length > 0 && (
          <ul role="alert" className="mt-4 space-y-1">
            {schemaWideProblems.map((p, i) => (
              <li key={i} className="text-sm text-danger-text">
                {p.message}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <FormSection
        title="Publishing"
        description="A template can only be published once its .docx has been attached."
      >
        <FormGrid>
          <FormRowFull>
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
          </FormRowFull>
        </FormGrid>
      </FormSection>

      {formError && (
        <Alert tone="danger" role="alert">
          {formError}
        </Alert>
      )}

      <FormActions>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Saving…" : existing ? "Save changes" : "Create template"}
        </Button>
        <Link
          href="/templates"
          className="text-sm font-medium text-ink-muted hover:text-ink"
        >
          Cancel
        </Link>
      </FormActions>
    </form>
  );
}
