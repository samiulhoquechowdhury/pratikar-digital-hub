"use client";

import type { Template, TemplateField } from "@pratikar/types";
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

// Reads Template.fieldSchema and renders one input per field — this is the
// piece the AI Document Generator (Milestone 4) will eventually bypass by
// collecting the same keys conversationally, so keep all validation/shape
// logic keyed off `field.key`, not positional/layout assumptions.
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
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const missing = template.fieldSchema
      .filter((field) => field.required)
      .filter((field) => {
        const value = values[field.key];
        return value === undefined || value === "";
      })
      .map((field) => field.key);

    if (missing.length > 0) {
      setMissingKeys(missing);
      return;
    }

    setMissingKeys([]);
    void onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>{template.title}</h2>
      {template.fieldSchema.map((field) => (
        <div key={field.key}>
          <label htmlFor={field.key}>
            {field.label}
            {field.required && " *"}
          </label>
          {renderInput(field, values[field.key], (raw) => setValue(field, raw))}
          {missingKeys.includes(field.key) && (
            <p role="alert">{field.label} is required.</p>
          )}
        </div>
      ))}
      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Generating…" : "Generate document"}
      </button>
    </form>
  );
}

function renderInput(
  field: TemplateField,
  value: string | number | undefined,
  onChange: (raw: string) => void,
) {
  const common = {
    id: field.key,
    name: field.key,
    placeholder: field.placeholder,
    value: value ?? "",
    onChange: (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => onChange(e.target.value),
  };

  switch (field.type) {
    case "textarea":
      return <textarea {...common} />;
    case "select":
      return (
        <select {...common}>
          <option value="" disabled>
            Select…
          </option>
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );
    case "number":
      return <input {...common} type="number" />;
    case "date":
      return <input {...common} type="date" />;
    case "text":
    default:
      return <input {...common} type="text" />;
  }
}
