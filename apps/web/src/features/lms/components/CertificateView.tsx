"use client";

import {
  Alert,
  BrandMark,
  Button,
  ButtonLink,
  SkeletonText,
} from "@pratikar/ui";
import { ArrowLeft } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";

import { Icon } from "@/shared/components/Icon";
import { apiClient } from "@/shared/lib/apiClient";
import { useAuth } from "@/shared/providers/AuthProvider";

import { useCourseOutline } from "../hooks/useCourseOutline";
import { verificationUrl } from "../lib/certificate";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

/** The certificate's wording, edited in Admin → Settings. */
interface CertificateDesign {
  title: string;
  issuerName: string;
  signatoryName: string;
  signatoryTitle: string;
  footerNote: string;
}

/** What prints if the settings can't be loaded — the wording before they existed. */
const DEFAULT_DESIGN: CertificateDesign = {
  title: "Certificate of Completion",
  issuerName: "Pratikar Digital Hub",
  signatoryName: "",
  signatoryTitle: "",
  footerNote: "",
};

/**
 * The certificate, built to be printed.
 *
 * The QR is rendered as an SVG data URI rather than a canvas so it stays
 * sharp at any print size — a fuzzy QR is an unscannable one, and scanning is
 * the entire point of putting it there.
 */
export function CertificateView({ enrollmentId }: { enrollmentId: string }) {
  const { outline, isLoading, error } = useCourseOutline(enrollmentId);
  const { user } = useAuth();
  const [qr, setQr] = useState<string | null>(null);
  const [design, setDesign] = useState<CertificateDesign>(DEFAULT_DESIGN);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get<CertificateDesign>("/settings/certificate")
      .then((loaded) => {
        if (!cancelled) setDesign(loaded);
      })
      .catch(() => {
        // The default wording is a complete certificate; nothing to say.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const code = outline?.certificate?.verificationCode;

  useEffect(() => {
    if (!code) return;
    let cancelled = false;

    QRCode.toString(verificationUrl(code), {
      type: "svg",
      margin: 0,
      // High correction: a printed certificate gets folded, stamped and
      // photocopied, and this is the level that survives that.
      errorCorrectionLevel: "H",
    })
      .then((svg) => {
        if (!cancelled) {
          setQr(`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`);
        }
      })
      .catch(() => {
        // The code is printed in text below the QR, so a failed render costs
        // convenience rather than verifiability.
        if (!cancelled) setQr(null);
      });

    return () => {
      cancelled = true;
    };
  }, [code]);

  if (isLoading)
    return <SkeletonText lines={5} label="Loading your certificate…" />;
  if (error || !outline) {
    return (
      <Alert tone="danger" role="alert">
        {error ?? "Couldn't load this course."}
      </Alert>
    );
  }

  if (!outline.certificate) {
    const short =
      outline.aggregateScorePercent !== null &&
      outline.aggregateScorePercent < outline.passMark;

    return (
      <div className="mx-auto max-w-xl space-y-4 text-center">
        <h1 className="text-2xl">No certificate yet</h1>
        <p className="text-base leading-relaxed text-ink-muted">
          {short
            ? `Your test average is ${outline.aggregateScorePercent}%. You need ${outline.passMark}% across every test — retakes are unlimited and your best score counts, so lifting it is a matter of retaking your weakest lessons.`
            : `Finish every lesson and its test, and score at least ${outline.passMark}% overall, and your certificate is issued automatically.`}
        </p>
        <ButtonLink href={`/learn/${enrollmentId}`}>
          Back to the course
        </ButtonLink>
      </div>
    );
  }

  const certificate = outline.certificate;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* print:* rules strip the chrome so the sheet that comes out is the
          certificate and nothing else. */}
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <ButtonLink href={`/learn/${enrollmentId}`} variant="secondary">
          <Icon icon={ArrowLeft} /> Back to the course
        </ButtonLink>
        <Button type="button" onClick={() => window.print()}>
          Print or save as PDF
        </Button>
      </div>

      <article className="relative overflow-hidden rounded-card border-4 border-double border-brand bg-surface p-8 text-center shadow-raised sm:p-12 print:border-2 print:shadow-none">
        <div className="flex items-center justify-center gap-3">
          <BrandMark className="h-11 w-auto text-primary" />
          <span className="flex flex-col items-start leading-none">
            <span className="bg-gradient-to-b from-wordmark-light-from to-wordmark-light-to bg-clip-text font-brand text-lg font-semibold tracking-[0.04em] text-transparent">
              PRATIKAR
            </span>
            <span className="mt-1 text-[0.65rem] font-medium uppercase tracking-[0.24em] text-ink-muted">
              Digital Hub
            </span>
          </span>
        </div>

        <p className="mt-10 text-xs font-semibold uppercase tracking-[0.3em] text-gold-ink">
          {design.title}
        </p>

        <p className="mt-8 text-sm text-ink-muted">This certifies that</p>
        <p className="mt-2 text-3xl font-semibold text-ink sm:text-4xl">
          {/* OTP signup never asks for a name, so this can genuinely be
              blank. Saying so beats printing an empty line. */}
          {user?.name ?? "Certificate holder"}
        </p>

        <p className="mt-6 text-sm text-ink-muted">
          has successfully completed
        </p>
        <p className="mt-2 text-xl font-medium text-ink">
          {outline.courseTitle}
        </p>

        {certificate.scorePercent !== null && (
          <p className="mt-4 text-sm text-ink-muted">
            with an assessment score of{" "}
            <span className="font-semibold text-ink">
              {certificate.scorePercent}%
            </span>
          </p>
        )}

        <p className="mt-4 text-sm text-ink-muted">
          issued by{" "}
          <span className="font-medium text-ink">{design.issuerName}</span>
        </p>

        {design.signatoryName && (
          <div className="mx-auto mt-10 w-56">
            <div aria-hidden className="h-px bg-ink/40" />
            <p className="mt-2 text-sm font-semibold text-ink">
              {design.signatoryName}
            </p>
            {design.signatoryTitle && (
              <p className="text-xs text-ink-muted">{design.signatoryTitle}</p>
            )}
          </div>
        )}

        <div
          aria-hidden
          className="mx-auto mt-8 h-px w-32 bg-gradient-to-r from-transparent via-brand to-transparent"
        />

        <div className="mt-8 flex flex-col items-center gap-6 sm:flex-row sm:justify-between sm:text-left">
          <div className="order-2 sm:order-1">
            <p className="text-xs uppercase tracking-wider text-ink-subtle">
              Issued
            </p>
            <p className="mt-1 text-sm font-medium text-ink">
              {formatDate(certificate.issuedAt)}
            </p>

            <p className="mt-4 text-xs uppercase tracking-wider text-ink-subtle">
              Certificate ID
            </p>
            <p className="mt-1 font-mono text-sm font-medium text-ink">
              {certificate.verificationCode}
            </p>
          </div>

          <div className="order-1 sm:order-2">
            {qr ? (
              // eslint-disable-next-line @next/next/no-img-element -- a data
              // URI needs no optimisation and next/image can't handle one.
              <img
                src={qr}
                alt={`QR code linking to the verification page for certificate ${certificate.verificationCode}`}
                className="h-28 w-28"
              />
            ) : (
              <div
                aria-hidden
                className="h-28 w-28 rounded border border-dashed border-line-strong"
              />
            )}
            <p className="mt-2 max-w-[7rem] text-center text-[0.6rem] leading-tight text-ink-subtle">
              Scan to verify
            </p>
          </div>
        </div>
        {design.footerNote && (
          <p className="mt-8 text-xs leading-relaxed text-ink-subtle">
            {design.footerNote}
          </p>
        )}
      </article>

      <p className="text-center text-xs leading-relaxed text-ink-subtle">
        Anyone can confirm this certificate is genuine by scanning the code or
        visiting{" "}
        <span className="font-mono">
          {verificationUrl(certificate.verificationCode)}
        </span>
        . No account is needed.
      </p>
    </div>
  );
}
