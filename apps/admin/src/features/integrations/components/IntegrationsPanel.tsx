"use client";

import {
  Alert,
  Badge,
  Button,
  Card,
  Field,
  Input,
  SkeletonList,
} from "@pratikar/ui";
import { useEffect, useState } from "react";

import {
  integrationsApi,
  type Integration,
  type IntegrationField,
  type TestResult,
} from "../api/integrationsApi";

/**
 * The outside services the site runs on, and their keys. A key saved here
 * is encrypted, works on the next request — no redeploy — and wins over the
 * server's .env value of the same name. Secrets are never shown back, only
 * their last four characters.
 */
export function IntegrationsPanel() {
  const [list, setList] = useState<Integration[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    integrationsApi
      .list()
      .then(setList)
      .catch(() => setError("Couldn't load the integrations."));
  }, []);

  if (error) {
    return (
      <Alert tone="danger" role="alert">
        {error}
      </Alert>
    );
  }
  if (!list) return <SkeletonList rows={5} label="Loading integrations…" />;

  const connected = list.filter((i) => i.configured).length;

  return (
    <div className="space-y-6">
      <Alert tone="info">
        {connected} of {list.length} services connected. Keys are encrypted when
        saved and only ever shown here by their last four characters. Every
        change is recorded in the audit log.
      </Alert>
      {list.map((integration) => (
        <IntegrationCard
          key={integration.id}
          integration={integration}
          onChange={setList}
        />
      ))}
    </div>
  );
}

function IntegrationCard({
  integration,
  onChange,
}: {
  integration: Integration;
  onChange: (list: Integration[]) => void;
}) {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [testPhone, setTestPhone] = useState("");

  const runTest = async () => {
    setTesting(true);
    setResult(null);
    try {
      setResult(
        await integrationsApi.test(
          integration.id,
          integration.id === "msg91" ? testPhone : undefined,
        ),
      );
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "";
      setResult({
        ok: false,
        message: message.includes("INVALID_PHONE")
          ? "Enter a 10-digit Indian mobile number for the test SMS."
          : message.includes("429")
            ? "Too many tests in a minute. Wait a moment."
            : "The test couldn't run. Please try again.",
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          <h2 className="text-lg font-semibold text-ink">{integration.name}</h2>
          <p className="mt-1 text-sm text-ink-muted">{integration.purpose}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge tone={integration.configured ? "success" : "warning"}>
            {integration.configured ? "Connected" : "Not set up"}
          </Badge>
          <a
            href={integration.console}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Get keys ↗
          </a>
        </div>
      </div>

      <div className="mt-6 space-y-5">
        {integration.fields.map((field) => (
          <FieldRow key={field.key} field={field} onChange={onChange} />
        ))}
      </div>

      {integration.testable ? (
        <div className="mt-6 space-y-3 border-t border-line pt-5">
          <div className="flex flex-wrap items-end gap-3">
            {integration.id === "msg91" ? (
              <div className="w-56">
                <Field
                  label="Send a test SMS to"
                  htmlFor="msg91-test-phone"
                  hint="Sends the sign-in template with code 123456."
                >
                  <Input
                    id="msg91-test-phone"
                    type="tel"
                    inputMode="numeric"
                    placeholder="98765 43210"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                  />
                </Field>
              </div>
            ) : null}
            <Button
              variant="secondary"
              loading={testing}
              loadingLabel="Testing…"
              onClick={() => void runTest()}
            >
              Test connection
            </Button>
          </div>
          {result ? (
            <Alert tone={result.ok ? "success" : "danger"} role="status">
              {result.message}
            </Alert>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}

const SOURCE_LABEL = {
  admin: "Saved here",
  server: "From the server's .env",
} as const;

function FieldRow({
  field,
  onChange,
}: {
  field: IntegrationField;
  onChange: (list: Integration[]) => void;
}) {
  const [value, setValue] = useState("");
  const [reveal, setReveal] = useState(false);
  const [busy, setBusy] = useState<"save" | "clear" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const id = `integration-${field.key}`;

  const save = async () => {
    setBusy("save");
    setError(null);
    setSaved(false);
    try {
      onChange(await integrationsApi.save(field.key, value));
      setValue("");
      setSaved(true);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "";
      setError(
        message.includes("ENCRYPTION_KEY_NOT_SET")
          ? "The server needs INTEGRATIONS_ENCRYPTION_KEY set before keys can be saved."
          : "Couldn't save. Please try again.",
      );
    } finally {
      setBusy(null);
    }
  };

  const clear = async () => {
    if (
      !window.confirm(
        `Remove the saved ${field.label}? The server's .env value is used instead, if there is one.`,
      )
    )
      return;
    setBusy("clear");
    setError(null);
    try {
      onChange(await integrationsApi.clear(field.key));
    } catch {
      setError("Couldn't remove it. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  const current = field.preview
    ? `Current: ${field.preview}${field.source ? ` · ${SOURCE_LABEL[field.source]}` : ""}`
    : field.required
      ? "Not set — required"
      : "Not set — optional";

  return (
    <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
      <Field
        label={field.label}
        htmlFor={id}
        hint={[current, field.hint].filter(Boolean).join(". ")}
        error={error ?? undefined}
      >
        <div className="relative">
          <Input
            id={id}
            type={field.secret && !reveal ? "password" : "text"}
            autoComplete="off"
            spellCheck={false}
            placeholder={
              field.preview
                ? "Enter a new value to replace it"
                : (field.placeholder ?? "")
            }
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setSaved(false);
            }}
            className={field.secret ? "pr-16 font-mono" : "font-mono"}
          />
          {field.secret ? (
            <button
              type="button"
              onClick={() => setReveal((r) => !r)}
              aria-label={
                reveal ? "Hide what you typed" : "Show what you typed"
              }
              className="absolute inset-y-0 right-0 px-3 text-xs font-semibold text-ink-subtle hover:text-ink"
            >
              {reveal ? "Hide" : "Show"}
            </button>
          ) : null}
        </div>
      </Field>
      <div className="flex gap-2 md:pb-6">
        <Button
          size="sm"
          disabled={!value.trim() || busy !== null}
          loading={busy === "save"}
          loadingLabel="Saving…"
          onClick={() => void save()}
        >
          {saved ? "Saved" : "Save"}
        </Button>
        {field.source === "admin" ? (
          <Button
            size="sm"
            variant="ghost"
            disabled={busy !== null}
            loading={busy === "clear"}
            onClick={() => void clear()}
          >
            Remove
          </Button>
        ) : null}
      </div>
    </div>
  );
}
