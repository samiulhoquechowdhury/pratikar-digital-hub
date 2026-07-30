"use client";

import Link from "next/link";
import { useState } from "react";

import { BuyButton } from "@/features/payments";
import { useAuth } from "@/shared/providers/AuthProvider";

import { contentLibraryApi } from "../api/contentLibraryApi";
import { useContentItem } from "../hooks/useContentItem";

const TYPE_LABELS = { EBOOK: "E-book", CHECKLIST: "Checklist" } as const;

export function ContentItemDetail({ itemId }: { itemId: string }) {
  const { user } = useAuth();
  const { item, isOwned, isLoading, error, refreshOwnership } = useContentItem(
    itemId,
    !!user,
  );
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const download = () => {
    setDownloadError(null);
    setIsDownloading(true);
    contentLibraryApi
      .download(itemId)
      .then(({ fileUrl }) => {
        // The URL is signed and short-lived, so it's fetched at click time and
        // never held in state — a stale one would already have expired.
        window.location.href = fileUrl;
      })
      .catch(() => {
        setDownloadError(
          "Couldn't start the download. If you've just paid, give it a few seconds and try again.",
        );
      })
      .finally(() => setIsDownloading(false));
  };

  if (!user) {
    return (
      <p>
        <Link href="/login">Sign in</Link> to view this item.
      </p>
    );
  }
  if (isLoading) return <p>Loading…</p>;
  if (error) return <p role="alert">{error}</p>;
  if (!item) return <p>This item isn&apos;t available.</p>;

  return (
    <article>
      <h1>{item.title}</h1>
      <p>{TYPE_LABELS[item.type]}</p>

      {isOwned ? (
        <div>
          <p>You own this.</p>
          <button type="button" onClick={download} disabled={isDownloading}>
            {isDownloading ? "Preparing…" : "Download"}
          </button>
          {downloadError && <p role="alert">{downloadError}</p>}
        </div>
      ) : (
        <BuyButton
          itemType="CONTENT_ITEM"
          itemId={item.id}
          label={item.title}
          priceInPaise={item.priceInPaise}
          onPaid={refreshOwnership}
        />
      )}

      <p>
        <Link href="/content-library">Back to the library</Link>
      </p>
    </article>
  );
}
