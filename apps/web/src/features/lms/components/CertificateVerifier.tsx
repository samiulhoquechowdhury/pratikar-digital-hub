"use client";

import type { CertificateVerification } from "@pratikar/types";
import { useEffect, useState } from "react";

import { Alert, Card, Loading } from "@/shared/components/ui";

import { lmsApi } from "../api/lmsApi";

/**
 * Public certificate check (docs/srs.md Section 7, item 5). The audience is
 * someone verifying a stranger's claim — an employer, a client — so it needs no
 * session, and an unknown code has to read as "not valid" rather than as an
 * error the visitor might mistake for a temporary fault.
 */
export function CertificateVerifier({ code }: { code: string }) {
  const [result, setResult] = useState<CertificateVerification | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    lmsApi
      .verifyCertificate(code)
      .then((verification) => {
        if (!cancelled) setResult(verification);
      })
      .catch(() => {
        if (!cancelled)
          setError(
            "Couldn't reach the verification service. Try again shortly.",
          );
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [code]);

  if (isLoading) return <Loading label="Checking this certificate…" />;
  if (error)
    return (
      <Alert tone="danger" role="alert">
        {error}
      </Alert>
    );

  if (!result?.valid) {
    return (
      <Card className="p-8">
        {/* Not styled as an error: an unknown code is a normal answer to a
            legitimate question, not a fault the visitor caused. */}
        <div className="flex items-start gap-4">
          <span
            aria-hidden
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface-sunken text-lg text-ink-muted"
          >
            ✕
          </span>
          <div>
            <h1 className="text-2xl">Not a valid certificate</h1>
            <p className="mt-2 text-base text-ink-muted">
              No certificate matches the code{" "}
              <code className="rounded bg-surface-sunken px-1.5 py-0.5 font-mono text-sm text-ink">
                {code}
              </code>
              . Check it for typos — the code is case-sensitive.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex items-start gap-4 border-b border-success-border bg-success-subtle px-8 py-6">
        <span
          aria-hidden
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-success text-lg text-ink-inverse"
        >
          ✓
        </span>
        <div>
          <h1 className="text-2xl text-success-text">Valid certificate</h1>
          <p className="mt-1 text-sm text-success-text">
            This certificate was issued by Pratikar Digital Hub.
          </p>
        </div>
      </div>

      <dl className="divide-y divide-line px-8">
        <div className="grid gap-1 py-4 sm:grid-cols-3">
          <dt className="text-sm font-medium text-ink-subtle">Course</dt>
          <dd className="text-base text-ink sm:col-span-2">
            {result.courseTitle}
          </dd>
        </div>
        <div className="grid gap-1 py-4 sm:grid-cols-3">
          <dt className="text-sm font-medium text-ink-subtle">Awarded to</dt>
          {/* Name is optional: OTP signup doesn't collect one. */}
          <dd className="text-base text-ink sm:col-span-2">
            {result.holderName ?? (
              <span className="text-ink-subtle">Name not on record</span>
            )}
          </dd>
        </div>
        <div className="grid gap-1 py-4 sm:grid-cols-3">
          <dt className="text-sm font-medium text-ink-subtle">Issued</dt>
          <dd className="text-base text-ink sm:col-span-2">
            {result.issuedAt
              ? new Date(result.issuedAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : "—"}
          </dd>
        </div>
        <div className="grid gap-1 py-4 sm:grid-cols-3">
          <dt className="text-sm font-medium text-ink-subtle">
            Verification code
          </dt>
          <dd className="sm:col-span-2">
            <code className="rounded bg-surface-sunken px-1.5 py-0.5 font-mono text-sm text-ink">
              {code}
            </code>
          </dd>
        </div>
      </dl>
    </Card>
  );
}
