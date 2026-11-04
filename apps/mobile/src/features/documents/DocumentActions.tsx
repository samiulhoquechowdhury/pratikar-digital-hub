import type { GeneratedDocumentStatus, Template } from "@pratikar/types";
import { useState } from "react";
import { View } from "react-native";

import { Text } from "@/components/Typography";
import { Button, Notice } from "@/components/ui";
import { BuyPanel } from "@/features/payments/BuyPanel";
import { saveAndShare } from "@/lib/download";
import { space, text } from "@/lib/theme";

import { documentsApi } from "./documentsApi";

/**
 * Pay for a generated document, download it once, or buy an advocate
 * review — the website's GeneratedDocumentActions.
 *
 * The download is one tap with no "check first": asking the server whether
 * a download is available would spend it (docs/srs.md Section 7, item 1),
 * so the button state comes from the document's status. Both files are
 * saved to the phone from that one call.
 */
export function DocumentActions({
  documentId,
  template,
  initialStatus,
  showReview = true,
  onChange,
}: {
  documentId: string;
  template: Pick<Template, "title" | "priceInPaise" | "reviewPriceInPaise">;
  initialStatus: GeneratedDocumentStatus;
  showReview?: boolean;
  onChange?: () => void;
}) {
  const [status, setStatus] = useState<GeneratedDocumentStatus>(initialStatus);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const download = async () => {
    setError(null);
    setIsDownloading(true);
    try {
      const { fileUrl, pdfUrl: pdf } = await documentsApi.download(documentId);
      setStatus("DOWNLOADED");
      setPdfUrl(pdf);
      onChange?.();
      await saveAndShare(fileUrl, `${template.title}.docx`);
    } catch (cause) {
      setError(
        cause instanceof Error && cause.message.includes("NOT_READY")
          ? "Your document is still being prepared. Try again in a few seconds — your download hasn't been used."
          : "Couldn't start the download. If you've just paid, wait a few seconds and try again.",
      );
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <View style={{ gap: space.xl }}>
      <View style={{ gap: space.md }}>
        <Text style={text.heading}>Your document</Text>
        {status === "GENERATED" ? (
          <BuyPanel
            itemType="DOCUMENT"
            itemId={documentId}
            label={template.title}
            priceInPaise={template.priceInPaise}
            onPaid={() => {
              setStatus("PAID");
              onChange?.();
            }}
          />
        ) : null}
        {status === "PAID" ? (
          <>
            {/* Warned before the tap: the request itself spends the download. */}
            <Notice tone="warning">
              Paid. The download works once — save the file somewhere safe when
              the share sheet opens.
            </Notice>
            <Button
              label="Download"
              loading={isDownloading}
              onPress={() => void download()}
            />
          </>
        ) : null}
        {status === "DOWNLOADED" && pdfUrl ? (
          <View style={{ gap: space.md }}>
            <Notice tone="success">
              Your Word file is saved. Save the PDF too — this link works for
              the next few minutes.
            </Notice>
            <Button
              label="Save the PDF"
              variant="secondary"
              onPress={() =>
                void saveAndShare(pdfUrl, `${template.title}.pdf`).catch(() =>
                  setError("Couldn't save the PDF. The link may have expired."),
                )
              }
            />
          </View>
        ) : null}
        {status === "DOWNLOADED" && !pdfUrl ? (
          <Notice>
            Already downloaded. Downloads are one-time, so this document can't
            be fetched again — contact support if something went wrong.
          </Notice>
        ) : null}
        {status === "REFUNDED" ? (
          <Notice>
            This document was refunded, so it can no longer be downloaded.
          </Notice>
        ) : null}
        {error ? <Notice tone="danger">{error}</Notice> : null}
      </View>

      {showReview && template.reviewPriceInPaise > 0 ? (
        <View style={{ gap: space.md }}>
          <Text style={text.heading}>Advocate review</Text>
          <Text style={text.muted}>
            Have an advocate check this document and send back a reviewed copy.
            Bought separately, whether or not you've downloaded it.
          </Text>
          <BuyPanel
            itemType="DOCUMENT_REVIEW"
            itemId={documentId}
            label={`Review: ${template.title}`}
            priceInPaise={template.reviewPriceInPaise}
            buyLabel="Buy a review"
            onPaid={onChange}
          />
        </View>
      ) : null}
    </View>
  );
}
