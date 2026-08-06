"use client";

import type { Template, TemplateField } from "@pratikar/types";
import {
  Alert,
  Button,
  Card,
  Field,
  Input,
  Select,
  Textarea,
} from "@pratikar/ui";
import { useState } from "react";

export type FilledData = Record<string, string | number>;

interface DynamicTemplateFormProps {
  template: Template;
  // Intentionally not awaited here — the caller (useGenerateDocument) tracks
  // its own isSubmitting/error state and surfaces failures via the `error` prop.
  onSubmit: (filledData: FilledData) => void | Promise<void>;
  isSubmitting: boolean;
  error?: string | null;
}

const isBlank = (value: string | number | undefined) =>
  value === undefined || value === "";

/**
 * Reads Template.fieldSchema and renders one input per field — this is the
 * piece the AI Document Generator (Milestone 4) will eventually bypass by
 * collecting the same keys conversationally, so all validation and shape logic
 * stays keyed off `field.key`, never off position or layout.
 *
 * Laid out as a single column at reading width rather than a dense two-column
 * grid. These are legal details — names, dates, amounts that end up in a
 * binding document — and a form that encourages skimming is the wrong shape
 * for that, even where the screen has room.
 */
export function DynamicTemplateForm({
  template,
  onSubmit,
  isSubmitting,
  error,
}: DynamicTemplateFormProps) {
  const [values, setValues] = useState<FilledData>({});
  const [missingKeys, setMissingKeys] = useState<string[]>([]);

  const setValue = (field: TemplateField, raw: string) => {
    setValues((prev) => ({
      ...prev,
      [field.key]: field.type === "number" ? Number(raw) : raw,
    }));

    // Clear this field's error as soon as it's filled. Leaving it up while the
    // person types tells them they're still wrong when they aren't.
    if (raw !== "" && missingKeys.includes(field.key)) {
      setMissingKeys((keys) => keys.filter((key) => key !== field.key));
    }
  };

  const required = template.fieldSchema.filter((field) => field.required);
  const answered = required.filter((field) => !isBlank(values[field.key]));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const missing = required
      .filter((field) => isBlank(values[field.key]))
      .map((field) => field.key);

    const [firstMissing] = missing;
    if (firstMissing !== undefined) {
      setMissingKeys(missing);
      // Send focus to the first problem rather than leaving the person to hunt
      // for it — on a long template it can be well off screen.
      document.getElementById(firstMissing)?.focus();
      return;
    }

    setMissingKeys([]);
    void onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Card className="p-6 sm:p-8">
        <div className="border-b border-line pb-5">
          <h2 className="text-xl">{template.title}</h2>
          <p className="mt-1 text-sm text-ink-muted">
            {required.length > 0
              ? `${answered.length} of ${required.length} required ${
                  required.length === 1 ? "question" : "questions"
                } answered`
              : "Fill in what applies — nothing here is required."}
          </p>
          {required.length > 0 && (
            <div
              aria-hidden
              className="mt-3 h-1 overflow-hidden rounded-full bg-surface-sunken"
            >
              <div
                className="h-full rounded-full bg-brand transition-[width] duration-300"
                style={{
                  width: `${(answered.length / required.length) * 100}%`,
                }}
              />
            </div>
          )}
        </div>

        <div className="mt-6 max-w-prose space-y-5">
          {template.fieldSchema.map((field) => (
            <Field
              key={field.key}
              label={field.required ? `${field.label} *` : field.label}
              htmlFor={field.key}
              error={
                missingKeys.includes(field.key)
                  ? `${field.label} is required.`
                  : undefined
              }
            >
              <FieldInput
                field={field}
                value={values[field.key]}
                invalid={missingKeys.includes(field.key)}
                onChange={(raw) => setValue(field, raw)}
              />
            </Field>
          ))}
        </div>

        {error && (
          <div className="mt-6 max-w-prose">
            <Alert tone="danger" role="alert">
              {error}
            </Alert>
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-line pt-6">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Generating…" : "Generate document"}
          </Button>
          {/* Says it before the click, not after: generating is free and the
              charge comes later, which is not what people expect from a form
              this long. */}
          <p className="text-sm text-ink-muted">
            You&apos;ll see the price before paying — generating costs nothing.
          </p>
        </div>
      </Card>
    </form>
  );
}

/** One input, chosen by field type. Styling lives in the shared primitives. */
function FieldInput({
  field,
  value,
  invalid,
  onChange,
}: {
  field: TemplateField;
  value: string | number | undefined;
  invalid: boolean;
  onChange: (raw: string) => void;
}) {
  const common = {
    id: field.key,
    name: field.key,
    placeholder: field.placeholder,
    value: value ?? "",
    // Field renders the message with role="alert", so it gets announced; this
    // marks the control itself so the state is exposed too, not just the text.
    "aria-invalid": invalid || undefined,
    onChange: (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => onChange(e.target.value),
  };

  const invalidRing = invalid ? "border-danger focus:border-danger" : "";

  switch (field.type) {
    case "textarea":
      return <Textarea {...common} className={invalidRing} />;
    case "select":
      return (
        <Select {...common} className={invalidRing}>
          <option value="" disabled>
            Select…
          </option>
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      );
    case "number":
      return <Input {...common} type="number" className={invalidRing} />;
    case "date":
      return <Input {...common} type="date" className={invalidRing} />;
    case "text":
    default:
      return <Input {...common} type="text" className={invalidRing} />;
  }
}
