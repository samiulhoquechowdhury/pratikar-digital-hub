"use client";

import { Alert, Button, SkeletonList } from "@pratikar/ui";
import { useCallback, useEffect, useState } from "react";

import { readinessApi, type ReadinessReport } from "../api/readinessApi";
import { groupChecks } from "../lib/group";

const MARK = {
  ok: {
    symbol: "✓",
    className: "bg-success-subtle text-success-text",
    word: "OK",
  },
  warn: {
    symbol: "!",
    className: "bg-warning-subtle text-warning-text",
    word: "Off / check",
  },
  fail: {
    symbol: "✕",
    className: "bg-danger-subtle text-danger-text",
    word: "Must fix",
  },
} as const;

/**
 * Everything that must be right before real customers arrive — each
 * service actually tried, each setting checked — with what to do about
 * anything that isn't. Run it on the live deployment before launch, and
 * after any change to its settings.
 */
export function LaunchChecklist() {
  const [report, setReport] = useState<ReadinessReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const run = useCallback(async () => {
    setChecking(true);
    setError(null);
    try {
      setReport(await readinessApi.report());
    } catch (cause) {
      setError(
        cause instanceof Error && cause.message.includes("403")
          ? "The launch checklist is for admins."
          : "Couldn't run the checks.",
      );
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    void run();
  }, [run]);

  if (error) {
    return (
      <Alert tone="danger" role="alert">
        {error}
      </Alert>
    );
  }
  if (!report) return <SkeletonList rows={6} label="Running the checks…" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Alert tone={report.ready ? "success" : "danger"} role="status">
          {report.ready
            ? `Ready for launch — ${report.summary.ok} checks pass${report.summary.warn ? `, ${report.summary.warn} optional features are off` : ""}.`
            : `Not ready — ${report.summary.fail} must be fixed before launch, ${report.summary.warn} to check, ${report.summary.ok} pass.`}
        </Alert>
        <Button
          variant="secondary"
          onClick={() => void run()}
          loading={checking}
          loadingLabel="Checking…"
        >
          Run the checks again
        </Button>
      </div>

      {groupChecks(report.checks).map((group) => (
        <section key={group.area} aria-labelledby={`area-${group.area}`}>
          <h2 id={`area-${group.area}`} className="text-base font-semibold">
            {group.area}
          </h2>
          <ul className="mt-2 divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
            {group.checks.map((check) => {
              const mark = MARK[check.status];
              return (
                <li key={check.id} className="flex gap-3 px-4 py-3">
                  <span
                    aria-hidden
                    className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold ${mark.className}`}
                  >
                    {mark.symbol}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">
                      {check.label}
                      <span className="sr-only"> — {mark.word}</span>
                    </p>
                    <p className="mt-0.5 break-words text-sm text-ink-muted">
                      {check.detail}
                    </p>
                    {check.fix && check.status !== "ok" && (
                      <p className="mt-1 text-sm text-ink">
                        <span className="font-semibold">To fix: </span>
                        {check.fix}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
