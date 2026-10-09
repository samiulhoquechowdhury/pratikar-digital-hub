"use client";

import { Alert, Button, Card, Field, Input, SkeletonList } from "@pratikar/ui";
import { useEffect, useState } from "react";

import { paiseToRupees } from "@/features/templates/lib/fieldSchema";

import {
  settingsApi,
  type CertificateSettings,
  type PricingSettings,
  type SettingRow,
} from "../api/settingsApi";

/**
 * Settings changed here rather than by redeploying. Each section says who
 * may change it; the API enforces the same rule.
 */
export function SettingsPanel() {
  const [rows, setRows] = useState<SettingRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    settingsApi
      .list()
      .then(setRows)
      .catch(() => setError("Couldn't load the settings."));
  }, []);

  if (error) {
    return (
      <Alert tone="danger" role="alert">
        {error}
      </Alert>
    );
  }
  if (!rows) return <SkeletonList rows={4} label="Loading settings…" />;

  return (
    <div className="space-y-8">
      {rows.map((row) =>
        row.key === "certificate" ? (
          <CertificateForm
            key={row.key}
            initial={row.value}
            canEdit={row.canEdit}
          />
        ) : (
          <PricingForm
            key={row.key}
            initial={row.value}
            canEdit={row.canEdit}
          />
        ),
      )}
    </div>
  );
}

function useSave(key: SettingRow["key"]) {
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<"saved" | "error" | null>(null);
  const save = async (value: object) => {
    setSaving(true);
    setResult(null);
    try {
      await settingsApi.save(key, value);
      setResult("saved");
    } catch {
      setResult("error");
    } finally {
      setSaving(false);
    }
  };
  return { saving, result, save };
}

function CertificateForm({
  initial,
  canEdit,
}: {
  initial: CertificateSettings;
  canEdit: boolean;
}) {
  const [value, setValue] = useState(initial);
  const { saving, result, save } = useSave("certificate");
  const field = (
    key: keyof CertificateSettings,
    label: string,
    hint?: string,
    max = 120,
  ) => (
    <Field label={label} htmlFor={`cert-${key}`} hint={hint}>
      <Input
        id={`cert-${key}`}
        value={value[key]}
        maxLength={max}
        disabled={!canEdit}
        onChange={(e) => setValue({ ...value, [key]: e.target.value })}
      />
    </Field>
  );

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold">Course certificate</h2>
      <p className="mt-1 text-sm text-ink-muted">
        The wording printed on every certificate, including ones already issued.
        Content Managers and Admins can change it.
      </p>
      <form
        className="mt-5 max-w-2xl space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void save(value);
        }}
      >
        {field("title", "Title", undefined, 80)}
        {field("issuerName", "Issued by")}
        <div className="grid gap-4 sm:grid-cols-2">
          {field(
            "signatoryName",
            "Signed by",
            "Leave blank for no signature line.",
            80,
          )}
          {field("signatoryTitle", "Signatory's title", "e.g. Director", 80)}
        </div>
        {field(
          "footerNote",
          "Footer note",
          "An accreditation or note under everything. Optional.",
          200,
        )}
        {canEdit && <SaveRow saving={saving} result={result} />}
      </form>
    </Card>
  );
}

function PricingForm({
  initial,
  canEdit,
}: {
  initial: PricingSettings;
  canEdit: boolean;
}) {
  const [rupees, setRupees] = useState(
    paiseToRupees(initial.customDraftReviewPricePaise),
  );
  const { saving, result, save } = useSave("pricing");
  const paise = Math.round(Number(rupees) * 100);

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold">Pricing</h2>
      <p className="mt-1 text-sm text-ink-muted">
        {canEdit
          ? "System settings — Super Admins only."
          : "System settings. Only a Super Admin can change these."}
      </p>
      <form
        className="mt-5 max-w-sm space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void save({ customDraftReviewPricePaise: paise });
        }}
      >
        <Field
          label="Advocate review of a custom AI draft (₹, before GST)"
          htmlFor="price-review"
          hint="What customers pay to have their AI-drafted document reviewed and unlocked."
        >
          <Input
            id="price-review"
            type="number"
            min={1}
            step="0.01"
            value={rupees}
            disabled={!canEdit}
            onChange={(e) => setRupees(e.target.value)}
          />
        </Field>
        {canEdit && <SaveRow saving={saving} result={result} />}
      </form>
    </Card>
  );
}

function SaveRow({
  saving,
  result,
}: {
  saving: boolean;
  result: "saved" | "error" | null;
}) {
  return (
    <div className="flex items-center gap-3">
      <Button type="submit" loading={saving} loadingLabel="Saving…">
        Save
      </Button>
      {result === "saved" && (
        <span role="status" className="text-sm text-success-text">
          Saved
        </span>
      )}
      {result === "error" && (
        <span role="alert" className="text-sm text-danger-text">
          Couldn&apos;t save — check the values.
        </span>
      )}
    </div>
  );
}
