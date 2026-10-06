"use client";

import { Alert, Skeleton } from "@pratikar/ui";
import { Eye } from "lucide-react";

import { Icon } from "@/shared/components/Icon";

import { useDocumentPreview } from "../hooks/useDocumentPreview";

/**
 * The generated document, page by page, watermarked — free to look at before
 * paying (docs/srs.md 3.2 step 3). The pages are pictures with the mark
 * burned in, so what's shown here can be read and checked but not copied
 * out as the document itself.
 */
export function DocumentPreview({
  documentId,
  title,
}: {
  documentId: string;
  title: string;
}) {
  const preview = useDocumentPreview(documentId);

  return (
    <section aria-label={`Preview of ${title}`}>
      <div className="flex items-center justify-between gap-3 rounded-t-card border border-b-0 border-line bg-surface-sunken px-4 py-2.5">
        <p className="flex items-center gap-2 text-sm font-medium text-ink">
          <Icon icon={Eye} className="text-primary" />
          Preview
        </p>
        <p className="text-xs text-ink-muted">
          Watermarked — the files you download are clean
        </p>
      </div>

      <div className="max-h-[48rem] overflow-y-auto rounded-b-card border border-line bg-surface-sunken p-4">
        {preview.status === "loading" ? (
          <div role="status" aria-busy="true" className="space-y-3">
            <span className="sr-only">Preparing your preview…</span>
            <Skeleton className="mx-auto aspect-[1/1.414] w-full max-w-2xl" />
            <p className="text-center text-sm text-ink-muted">
              Preparing your document — this takes a few seconds…
            </p>
          </div>
        ) : preview.status === "slow" ? (
          <Alert tone="warning">
            Your document is taking longer than usual. It will appear in My
            documents as soon as it&apos;s ready.
          </Alert>
        ) : preview.status === "error" ? (
          <Alert tone="danger" role="alert">
            Couldn&apos;t load the preview. Please reload the page.
          </Alert>
        ) : preview.pages.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink-muted">
            No preview for this document — it was made before previews existed.
          </p>
        ) : (
          <ol className="space-y-4">
            {preview.pages.map((src, index) => (
              <li key={src}>
                {/* Signed, short-lived links to images the API streams, so
                    next/image's optimiser has nothing to add. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`${title}, page ${index + 1} of ${preview.pages.length}`}
                  loading={index === 0 ? "eager" : "lazy"}
                  draggable={false}
                  onContextMenu={(event) => event.preventDefault()}
                  className="mx-auto w-full max-w-2xl select-none rounded-control bg-surface shadow-card"
                />
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
