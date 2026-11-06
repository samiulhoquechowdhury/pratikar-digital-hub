import type { Template, TemplateField } from "@pratikar/types";
import { CalendarDays } from "lucide-react-native";
import { useState, type ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { OptionPicker } from "@/components/OptionPicker";
import { Text } from "@/components/Typography";
import { Button, Field, Notice } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { IS_WEB } from "@/lib/platform";
import { colors, radius, space, text } from "@/lib/theme";

export type FilledData = Record<string, string | number>;

const isBlank = (value: string | number | undefined) =>
  value === undefined || value === "";

/** YYYY-MM-DD for a local date — what the API accepts for a date field. */
const toIsoDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

/**
 * The website's DynamicTemplateForm: one input per field of
 * Template.fieldSchema, keyed by `field.key`, in a single column — these
 * are names, dates and amounts that end up in a binding document.
 *
 * Numbers are held as typed and converted on submit, so "12." can become
 * "12.5" without the point vanishing mid-keystroke.
 */
export function DynamicForm({
  template,
  onSubmit,
  isSubmitting,
  error,
  initialValues,
  notice,
}: {
  template: Template;
  onSubmit: (filledData: FilledData) => void | Promise<void>;
  isSubmitting: boolean;
  error?: string | null;
  initialValues?: FilledData;
  notice?: ReactNode;
}) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      Object.entries(initialValues ?? {}).map(([k, v]) => [k, String(v)]),
    ),
  );
  const [missingKeys, setMissingKeys] = useState<string[]>([]);

  const setValue = (field: TemplateField, raw: string) => {
    setValues((prev) => ({ ...prev, [field.key]: raw }));
    if (raw !== "" && missingKeys.includes(field.key)) {
      setMissingKeys((keys) => keys.filter((key) => key !== field.key));
    }
  };

  const required = template.fieldSchema.filter((f) => f.required);
  const answered = required.filter((f) => !isBlank(values[f.key]?.trim()));

  const submit = () => {
    const missing = required
      .filter((f) => isBlank(values[f.key]?.trim()))
      .map((f) => f.key);
    setMissingKeys(missing);
    if (missing.length > 0) return;

    const filled: FilledData = {};
    for (const field of template.fieldSchema) {
      const raw = values[field.key]?.trim();
      if (isBlank(raw)) continue;
      filled[field.key] =
        field.type === "number" ? Number(raw.replace(/,/g, "")) : raw;
    }
    void onSubmit(filled);
  };

  return (
    <View style={{ gap: space.lg }}>
      {notice}
      {required.length > 0 ? (
        <Text style={text.small}>
          {answered.length} of {required.length} required questions answered
        </Text>
      ) : null}

      {template.fieldSchema.map((field) => {
        const missing = missingKeys.includes(field.key);
        const label = `${field.label}${field.required ? " *" : ""}`;
        const fieldError = missing ? "This one is required." : null;
        const value = values[field.key] ?? "";

        switch (field.type) {
          case "select":
            return (
              <SelectField
                key={field.key}
                label={label}
                field={field}
                value={value}
                error={fieldError}
                onChange={(v) => setValue(field, v)}
              />
            );
          case "date":
            return (
              <DateField
                key={field.key}
                label={label}
                value={value}
                error={fieldError}
                onChange={(v) => setValue(field, v)}
              />
            );
          default:
            return (
              <Field
                key={field.key}
                label={label}
                value={value}
                onChangeText={(v) => setValue(field, v)}
                placeholder={field.placeholder}
                error={fieldError}
                multiline={field.type === "textarea"}
                keyboardType={
                  field.type === "number" ? "decimal-pad" : "default"
                }
                style={
                  field.type === "textarea"
                    ? {
                        minHeight: 110,
                        textAlignVertical: "top",
                        paddingTop: 12,
                      }
                    : undefined
                }
              />
            );
        }
      })}

      {missingKeys.length > 0 ? (
        <Notice tone="danger">
          {missingKeys.length === 1
            ? "One required question still needs an answer."
            : `${missingKeys.length} required questions still need answers.`}
        </Notice>
      ) : null}
      {error ? <Notice tone="danger">{error}</Notice> : null}

      <Button
        label={isSubmitting ? "Generating…" : "Generate document"}
        loading={isSubmitting}
        onPress={submit}
      />
    </View>
  );
}

function SelectField({
  label,
  field,
  value,
  error,
  onChange,
}: {
  label: string;
  field: TemplateField;
  value: string;
  error: string | null;
  onChange: (value: string) => void;
}) {
  return (
    <OptionPicker
      label={label}
      title={field.label}
      options={field.options ?? []}
      value={value}
      onChange={onChange}
      placeholder={field.placeholder ?? "Choose one"}
      error={error}
    />
  );
}

/** The native picker, loaded only on a phone — it has no browser version. */
// Loaded only off the web, where the native picker exists.
/* eslint-disable @typescript-eslint/no-require-imports */
const NativeDatePicker = IS_WEB
  ? () => null
  : (
      require("@react-native-community/datetimepicker") as typeof import("@react-native-community/datetimepicker")
    ).default;
/* eslint-enable @typescript-eslint/no-require-imports */

function DateField({
  label,
  value,
  error,
  onChange,
}: {
  label: string;
  value: string;
  error: string | null;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00`)
    : null;

  // The browser preview has no native picker; the browser's own date box
  // gives the same YYYY-MM-DD.
  if (IS_WEB) {
    return (
      <View style={{ gap: space.xs }}>
        <Text style={styles.label}>{label}</Text>
        <input
          type="date"
          aria-label={label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            minHeight: 48,
            padding: "0 12px",
            fontSize: 16,
            borderRadius: radius.control,
            border: `1px solid ${error ? colors.danger : colors.lineStrong}`,
            color: colors.ink,
            fontFamily: "inherit",
          }}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    );
  }

  return (
    <View style={{ gap: space.xs }}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${date ? formatDate(date.toISOString()) : "not set"}`}
        onPress={() => setOpen(true)}
        style={[styles.control, error ? { borderColor: colors.danger } : null]}
      >
        <Text style={[styles.value, !date && { color: colors.inkSubtle }]}>
          {date ? formatDate(date.toISOString()) : "Pick a date"}
        </Text>
        <CalendarDays color={colors.inkSubtle} size={18} />
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {open ? (
        <NativeDatePicker
          value={date ?? new Date()}
          mode="date"
          onChange={(event, picked) => {
            setOpen(false);
            if (event.type === "set" && picked) onChange(toIsoDate(picked));
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 14, fontWeight: "600", color: colors.ink },
  control: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radius.control,
    paddingHorizontal: space.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space.sm,
  },
  value: { fontSize: 16, color: colors.ink },
  error: { fontSize: 13, color: colors.danger },
});
