"use client";

import type { TemplateFieldSchema, TemplateFieldType } from "@pratikar/types";
import { Button, Field, Input, Select } from "@pratikar/ui";

import {
  FIELD_TYPES,
  addField,
  moveField,
  removeField,
  updateField,
  type FieldSchemaProblem,
} from "../lib/fieldSchema";

interface Props {
  schema: TemplateFieldSchema;
  problems: FieldSchemaProblem[];
  onChange: (next: TemplateFieldSchema) => void;
}

const TYPE_LABELS: Record<TemplateFieldType, string> = {
  text: "Single line",
  textarea: "Paragraph",
  date: "Date",
  number: "Number",
  select: "Dropdown",
};

/** Small square button used for the reorder and remove controls. */
const ICON_BUTTON =
  "rounded-control border border-line-strong bg-surface px-2 py-1 text-xs text-ink-muted hover:bg-surface-sunken disabled:opacity-40";

/**
 * The form-builder-for-forms: what a Content Manager edits here becomes the
 * customer-facing form in apps/web (DynamicTemplateForm renders straight from
 * this schema), and each `key` has to match a {tag} in the uploaded .docx.
 *
 * That last part is why the key input is monospace and echoes the tag back as
 * you type. A key that doesn't match its tag doesn't fail loudly — the clause
 * just renders blank, which in a rent agreement is a legally meaningful defect
 * nobody notices until it matters.
 */
export function FieldSchemaEditor({ schema, problems, onChange }: Props) {
  const problemsFor = (index: number) =>
    problems.filter((p) => p.index === index);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
        <div>
          <h2 className="text-base">Form fields</h2>
          <p className="mt-1 max-w-prose text-sm text-ink-muted">
            Each key must match a{" "}
            <code className="text-gold-ink">{"{tag}"}</code> in the uploaded
            .docx. The order here is the order customers fill them in.
          </p>
        </div>
        <span className="text-sm text-ink-subtle">
          {schema.length} {schema.length === 1 ? "field" : "fields"}
        </span>
      </div>

      {schema.length === 0 ? (
        <p className="mt-5 rounded-card border border-dashed border-line-strong px-4 py-8 text-center text-sm text-ink-muted">
          No fields yet. A template with no fields generates an empty document.
        </p>
      ) : (
        <ol className="mt-5 space-y-4">
          {schema.map((field, index) => {
            const fieldProblems = problemsFor(index);
            const hasProblem = fieldProblems.length > 0;

            return (
              <li
                key={index}
                className={`rounded-card border p-4 ${
                  hasProblem
                    ? "border-danger-border bg-danger-subtle"
                    : "border-line bg-canvas"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-ink-inverse"
                  >
                    {index + 1}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field
                        label="Key"
                        htmlFor={`field-key-${index}`}
                        hint={
                          field.key
                            ? `Matches {${field.key}} in the .docx`
                            : "Letters, numbers and underscores only"
                        }
                      >
                        <Input
                          id={`field-key-${index}`}
                          value={field.key}
                          onChange={(e) =>
                            onChange(
                              updateField(schema, index, {
                                key: e.target.value,
                              }),
                            )
                          }
                          placeholder="landlordName"
                          className="font-mono text-sm"
                          spellCheck={false}
                          autoCapitalize="off"
                        />
                      </Field>

                      <Field label="Label" htmlFor={`field-label-${index}`}>
                        <Input
                          id={`field-label-${index}`}
                          value={field.label}
                          onChange={(e) =>
                            onChange(
                              updateField(schema, index, {
                                label: e.target.value,
                              }),
                            )
                          }
                          placeholder="Landlord's full name"
                        />
                      </Field>

                      <Field label="Type" htmlFor={`field-type-${index}`}>
                        <Select
                          id={`field-type-${index}`}
                          value={field.type}
                          onChange={(e) =>
                            onChange(
                              updateField(schema, index, {
                                type: e.target.value as TemplateFieldType,
                              }),
                            )
                          }
                        >
                          {FIELD_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {TYPE_LABELS[t]}
                            </option>
                          ))}
                        </Select>
                      </Field>

                      <Field
                        label="Placeholder"
                        htmlFor={`field-placeholder-${index}`}
                        hint="Optional example shown inside the empty input."
                      >
                        <Input
                          id={`field-placeholder-${index}`}
                          value={field.placeholder ?? ""}
                          onChange={(e) =>
                            onChange(
                              updateField(schema, index, {
                                placeholder: e.target.value || undefined,
                              }),
                            )
                          }
                        />
                      </Field>
                    </div>

                    <label
                      htmlFor={`field-required-${index}`}
                      className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-ink"
                    >
                      <input
                        id={`field-required-${index}`}
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) =>
                          onChange(
                            updateField(schema, index, {
                              required: e.target.checked,
                            }),
                          )
                        }
                        className="h-4 w-4 rounded border-line-strong accent-navy-800"
                      />
                      Required
                    </label>

                    {field.type === "select" && (
                      <div className="mt-4 rounded-card border border-line bg-surface p-4">
                        <p className="text-sm font-medium text-ink">
                          Dropdown options
                        </p>
                        <p className="mt-1 text-xs text-ink-muted">
                          The value goes into the document; the label is what
                          the customer picks.
                        </p>

                        <ul className="mt-3 space-y-2">
                          {(field.options ?? []).map((option, optionIndex) => (
                            <li
                              key={optionIndex}
                              className="flex flex-wrap items-end gap-2"
                            >
                              <div className="min-w-0 flex-1">
                                <label
                                  htmlFor={`opt-value-${index}-${optionIndex}`}
                                  className="block text-xs font-medium text-ink-muted"
                                >
                                  Value
                                </label>
                                <Input
                                  id={`opt-value-${index}-${optionIndex}`}
                                  value={option.value}
                                  onChange={(e) =>
                                    onChange(
                                      updateField(schema, index, {
                                        options: (field.options ?? []).map(
                                          (o, i) =>
                                            i === optionIndex
                                              ? { ...o, value: e.target.value }
                                              : o,
                                        ),
                                      }),
                                    )
                                  }
                                  className="mt-1 py-1.5 font-mono text-sm"
                                />
                              </div>

                              <div className="min-w-0 flex-1">
                                <label
                                  htmlFor={`opt-label-${index}-${optionIndex}`}
                                  className="block text-xs font-medium text-ink-muted"
                                >
                                  Label
                                </label>
                                <Input
                                  id={`opt-label-${index}-${optionIndex}`}
                                  value={option.label}
                                  onChange={(e) =>
                                    onChange(
                                      updateField(schema, index, {
                                        options: (field.options ?? []).map(
                                          (o, i) =>
                                            i === optionIndex
                                              ? { ...o, label: e.target.value }
                                              : o,
                                        ),
                                      }),
                                    )
                                  }
                                  className="mt-1 py-1.5 text-sm"
                                />
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  onChange(
                                    updateField(schema, index, {
                                      options: (field.options ?? []).filter(
                                        (_, i) => i !== optionIndex,
                                      ),
                                    }),
                                  )
                                }
                                className="rounded-control border border-danger-border px-2 py-1.5 text-xs text-danger-text hover:bg-danger-subtle"
                              >
                                <span className="sr-only">
                                  Remove option {optionIndex + 1}
                                </span>
                                <span aria-hidden>×</span>
                              </button>
                            </li>
                          ))}
                        </ul>

                        <button
                          type="button"
                          onClick={() =>
                            onChange(
                              updateField(schema, index, {
                                options: [
                                  ...(field.options ?? []),
                                  { value: "", label: "" },
                                ],
                              }),
                            )
                          }
                          className="mt-3 text-sm font-semibold text-primary hover:text-primary-hover"
                        >
                          Add option
                        </button>
                      </div>
                    )}

                    {hasProblem && (
                      <ul role="alert" className="mt-4 space-y-1">
                        {fieldProblems.map((p, i) => (
                          <li key={i} className="text-sm text-danger-text">
                            {p.message}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-col gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        onChange(moveField(schema, index, index - 1))
                      }
                      disabled={index === 0}
                      className={ICON_BUTTON}
                    >
                      <span className="sr-only">Move up</span>
                      <span aria-hidden>↑</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onChange(moveField(schema, index, index + 1))
                      }
                      disabled={index === schema.length - 1}
                      className={ICON_BUTTON}
                    >
                      <span className="sr-only">Move down</span>
                      <span aria-hidden>↓</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onChange(removeField(schema, index))}
                      className="rounded-control border border-danger-border px-2 py-1 text-xs text-danger-text hover:bg-danger-subtle"
                    >
                      <span className="sr-only">Remove field {index + 1}</span>
                      <span aria-hidden>×</span>
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <div className="mt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={() => onChange(addField(schema))}
        >
          Add field
        </Button>
      </div>
    </div>
  );
}
