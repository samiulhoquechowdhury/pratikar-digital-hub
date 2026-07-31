"use client";

import type { TemplateFieldSchema, TemplateFieldType } from "@pratikar/types";

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

/**
 * The form-builder-for-forms: what a Content Manager edits here becomes the
 * customer-facing form in apps/web (DynamicTemplateForm renders straight from
 * this schema), and each `key` has to match a {tag} in the uploaded .docx.
 */
export function FieldSchemaEditor({ schema, problems, onChange }: Props) {
  const problemsFor = (index: number) =>
    problems.filter((p) => p.index === index);

  return (
    <fieldset>
      <legend>Form fields</legend>
      <p>
        Each key must match a <code>{"{tag}"}</code> in the uploaded .docx.
        Order here is the order customers fill them in.
      </p>

      {schema.length === 0 && <p>No fields yet.</p>}

      <ol>
        {schema.map((field, index) => {
          const fieldProblems = problemsFor(index);
          return (
            <li key={index}>
              <div>
                <label htmlFor={`field-key-${index}`}>Key</label>
                <input
                  id={`field-key-${index}`}
                  value={field.key}
                  onChange={(e) =>
                    onChange(
                      updateField(schema, index, { key: e.target.value }),
                    )
                  }
                  placeholder="landlordName"
                />

                <label htmlFor={`field-label-${index}`}>Label</label>
                <input
                  id={`field-label-${index}`}
                  value={field.label}
                  onChange={(e) =>
                    onChange(
                      updateField(schema, index, { label: e.target.value }),
                    )
                  }
                  placeholder="Landlord's full name"
                />

                <label htmlFor={`field-type-${index}`}>Type</label>
                <select
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
                      {t}
                    </option>
                  ))}
                </select>

                <label htmlFor={`field-required-${index}`}>
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
                  />
                  Required
                </label>

                <label htmlFor={`field-placeholder-${index}`}>
                  Placeholder
                </label>
                <input
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
              </div>

              {field.type === "select" && (
                <div>
                  <p>Dropdown options</p>
                  {(field.options ?? []).map((option, optionIndex) => (
                    <div key={optionIndex}>
                      <label htmlFor={`opt-value-${index}-${optionIndex}`}>
                        Value
                      </label>
                      <input
                        id={`opt-value-${index}-${optionIndex}`}
                        value={option.value}
                        onChange={(e) =>
                          onChange(
                            updateField(schema, index, {
                              options: (field.options ?? []).map((o, i) =>
                                i === optionIndex
                                  ? { ...o, value: e.target.value }
                                  : o,
                              ),
                            }),
                          )
                        }
                      />
                      <label htmlFor={`opt-label-${index}-${optionIndex}`}>
                        Label
                      </label>
                      <input
                        id={`opt-label-${index}-${optionIndex}`}
                        value={option.label}
                        onChange={(e) =>
                          onChange(
                            updateField(schema, index, {
                              options: (field.options ?? []).map((o, i) =>
                                i === optionIndex
                                  ? { ...o, label: e.target.value }
                                  : o,
                              ),
                            }),
                          )
                        }
                      />
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
                      >
                        Remove option
                      </button>
                    </div>
                  ))}
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
                  >
                    Add option
                  </button>
                </div>
              )}

              {fieldProblems.length > 0 && (
                <ul role="alert">
                  {fieldProblems.map((p, i) => (
                    <li key={i}>{p.message}</li>
                  ))}
                </ul>
              )}

              <div>
                <button
                  type="button"
                  onClick={() => onChange(moveField(schema, index, index - 1))}
                  disabled={index === 0}
                >
                  Move up
                </button>
                <button
                  type="button"
                  onClick={() => onChange(moveField(schema, index, index + 1))}
                  disabled={index === schema.length - 1}
                >
                  Move down
                </button>
                <button
                  type="button"
                  onClick={() => onChange(removeField(schema, index))}
                >
                  Remove field
                </button>
              </div>
            </li>
          );
        })}
      </ol>

      <button type="button" onClick={() => onChange(addField(schema))}>
        Add field
      </button>
    </fieldset>
  );
}
