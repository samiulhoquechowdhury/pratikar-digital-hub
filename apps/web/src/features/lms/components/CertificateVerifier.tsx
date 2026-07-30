"use client";

import type { CertificateVerification } from "@pratikar/types";
import { useEffect, useState } from "react";

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

  if (isLoading) return <p>Checking this certificate…</p>;
  if (error) return <p role="alert">{error}</p>;

  if (!result?.valid) {
    return (
      <div>
        <h1>Not a valid certificate</h1>
        <p>
          No certificate matches the code <code>{code}</code>. Check the code
          for typos — it&apos;s case-sensitive.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1>Valid certificate</h1>
      <dl>
        <dt>Course</dt>
        <dd>{result.courseTitle}</dd>
        <dt>Awarded to</dt>
        {/* Name is optional: OTP signup doesn't collect one. */}
        <dd>{result.holderName ?? "Name not on record"}</dd>
        <dt>Issued</dt>
        <dd>
          {result.issuedAt
            ? new Date(result.issuedAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })
            : "—"}
        </dd>
        <dt>Verification code</dt>
        <dd>
          <code>{code}</code>
        </dd>
      </dl>
    </div>
  );
}
