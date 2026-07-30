"use client";

import type { GeneratedDocumentStatus, Template } from "@pratikar/types";
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

  const download = () => {
    setError(null);
    setIsDownloading(true);
    documentsApi
      .download(documentId)
      .then(({ fileUrl }) => {
        // Mark it spent before navigating: the server has already consumed the
        // link by this point, so the UI must not keep offering it.
        setStatus("DOWNLOADED");
        window.location.href = fileUrl;
      })
      .catch(() => {
        setError(
          "Couldn't start the download. If you've just paid, wait a few seconds and try again.",
        );
      })
      .finally(() => setIsDownloading(false));
  };

  return (
    <section>
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
        <div>
          <p>
            Paid. This link works once — save the file somewhere safe when it
            downloads.
          </p>
          <button type="button" onClick={download} disabled={isDownloading}>
            {isDownloading ? "Preparing…" : "Download"}
          </button>
        </div>
      )}

      {status === "DOWNLOADED" && (
        <p>
          Already downloaded. Downloads are one-time, so this document
          can&apos;t be fetched again — contact support if something went wrong.
        </p>
      )}

      {error && <p role="alert">{error}</p>}

      <h3>Lawyer review</h3>
      <p>
        Have a lawyer check this document and send back comments. Bought
        separately from the document itself.
      </p>
      <BuyButton
        itemType="DOCUMENT_REVIEW"
        itemId={documentId}
        label={`Review: ${template.title}`}
        priceInPaise={template.reviewPriceInPaise}
      />
    </section>
  );
}
