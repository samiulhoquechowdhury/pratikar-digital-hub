"use client";

import type { GeneratedDocumentStatus, Template } from "@pratikar/types";
import { Alert, Button, Card } from "@pratikar/ui";
import { useState } from "react";

import { BuyButton } from "@/features/payments";

import { documentsApi } from "../api/documentsApi";

/**
 * What a customer can do with a document they've generated: pay for it,
 * download it once, or buy a lawyer review.
 *
 * The download is deliberately one click with no "check first" step — asking
 * the server whether a download is available would consume it (docs/srs.md
 * Section 7, item 1), so the button state comes from the document's status.
 */
export function GeneratedDocumentActions({
  documentId,
  template,
  initialStatus,
}: {
  documentId: string;
  template: Pick<Template, "title" | "priceInPaise" | "reviewPriceInPaise">;
  initialStatus: GeneratedDocumentStatus;
}) {
  const [status, setStatus] = useState<GeneratedDocumentStatus>(initialStatus);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // The PDF's signed link, kept just long enough to offer it after the Word
  // file starts: the download is spent once, and both come from that call.
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const download = () => {
    setError(null);
    setIsDownloading(true);
    documentsApi
      .download(documentId)
      .then(({ fileUrl, pdfUrl: pdf }) => {
        setStatus("DOWNLOADED");
        setPdfUrl(pdf);
        window.location.href = fileUrl;
      })
      .catch((cause: unknown) => {
        setError(
          cause instanceof Error && cause.message.includes("NOT_READY")
            ? "Your document is still being prepared. Try again in a few seconds — your download hasn't been used."
            : "Couldn't start the download. If you've just paid, wait a few seconds and try again.",
        );
      })
      .finally(() => setIsDownloading(false));
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-base">Your document</h3>

        <div className="mt-4">
          {status === "GENERATED" && (
            <BuyButton
              itemType="DOCUMENT"
              itemId={documentId}
              label={template.title}
              priceInPaise={template.priceInPaise}
              onPaid={() => setStatus("PAID")}
            />
          )}

          {status === "PAID" && (
            <div className="space-y-4">
              {/* Warned before the click, not after: the entitlement is spent
                  by the request itself, so there is no second chance to
                  explain what just happened. */}
              <Alert tone="warning">
                Paid. This link works once — save the file somewhere safe when
                it downloads.
              </Alert>
              <Button type="button" onClick={download} disabled={isDownloading}>
                {isDownloading ? "Preparing…" : "Download"}
              </Button>
            </div>
          )}

          {status === "DOWNLOADED" && pdfUrl && (
            <Alert tone="success" role="status">
              Your Word file is downloading.{" "}
              <a href={pdfUrl} className="font-semibold underline">
                Download the PDF too
              </a>{" "}
              — this link works for the next few minutes.
            </Alert>
          )}

          {status === "DOWNLOADED" && !pdfUrl && (
            <Alert tone="info">
              Already downloaded. Downloads are one-time, so this document
              can&apos;t be fetched again — contact support if something went
              wrong.
            </Alert>
          )}

          {error && (
            <div className="mt-4">
              <Alert tone="danger" role="alert">
                {error}
              </Alert>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-base">Lawyer review</h3>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-ink-muted">
          Have a lawyer check this document and send back comments. Bought
          separately from the document itself, and available whether or not
          you&apos;ve downloaded it.
        </p>
        <div className="mt-4">
          <BuyButton
            itemType="DOCUMENT_REVIEW"
            itemId={documentId}
            label={`Review: ${template.title}`}
            priceInPaise={template.reviewPriceInPaise}
          />
        </div>
      </Card>
    </div>
  );
}
