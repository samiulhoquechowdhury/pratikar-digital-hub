"use client";

import {
  Alert,
  Badge,
  Button,
  ButtonLink,
  Card,
  EmptyState,
  Loading,
} from "@pratikar/ui";
import Link from "next/link";
import { useState } from "react";

import { BuyButton } from "@/features/payments";
import { useAuth } from "@/shared/providers/AuthProvider";

import { contentLibraryApi } from "../api/contentLibraryApi";
import { useContentItem } from "../hooks/useContentItem";

const TYPE_LABELS = { EBOOK: "E-book", CHECKLIST: "Checklist" } as const;

/** SCREAMING_CASE enum values are not customer-facing copy. */
const CATEGORY_LABELS: Record<string, string> = {
  LEGAL_PRACTICE: "Legal practice",
  BUSINESS_COMPLIANCE: "Business & compliance",
  PROPERTY_DOCUMENTATION: "Property documentation",
  DIGITAL_CAREER: "Digital career",
  CHECKLISTS_REFERENCE: "Checklists & reference",
};

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
      <EmptyState
        title="Sign in to view this item"
        description="The library is available to signed-in customers."
        action={
          <ButtonLink href={`/login?next=/content-library/${itemId}`}>
            Sign in
          </ButtonLink>
        }
      />
    );
  }

  if (isLoading) return <Loading />;

  if (error) {
    return (
      <Alert tone="danger" role="alert">
        {error}
      </Alert>
    );
  }

  if (!item) {
    return (
      <EmptyState
        title="This item isn't available"
        description="It may have been unpublished, or the link may be wrong."
        action={
          <ButtonLink href="/content-library">Back to library</ButtonLink>
        }
      />
    );
  }

  return (
    <article className="space-y-6">
      <Link
        href="/content-library"
        className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-hover"
      >
        <span aria-hidden>←</span> Back to the library
      </Link>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Card className="p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="brand">{TYPE_LABELS[item.type]}</Badge>
            <Badge>{CATEGORY_LABELS[item.category] ?? item.category}</Badge>
          </div>

          <h1 className="mt-4 text-3xl">{item.title}</h1>

          {/* The catalogue carries no description field yet, so rather than
              leave a blank slab this says what the format actually gets you.
              Worth replacing with real copy once the model has somewhere to
              put it. */}
          <p className="mt-4 max-w-prose text-base leading-relaxed text-ink-muted">
            {item.type === "EBOOK"
              ? "A long-form guide you can download and keep. Buy once — it stays in your account."
              : "A step-by-step reference sheet you can download, print, and work through. Buy once — it stays in your account."}
          </p>
        </Card>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Card className="p-6">
            {isOwned ? (
              <>
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className="grid h-6 w-6 place-items-center rounded-full bg-success-subtle text-xs text-success-text"
                  >
                    ✓
                  </span>
                  <h2 className="text-base">You own this</h2>
                </div>
                <p className="mt-2 text-sm text-ink-muted">
                  Download it as often as you need — it stays in your account.
                </p>
                <div className="mt-4">
                  <Button
                    type="button"
                    onClick={download}
                    disabled={isDownloading}
                  >
                    {isDownloading ? "Preparing…" : "Download"}
                  </Button>
                </div>
                {downloadError && (
                  <div className="mt-4">
                    <Alert tone="danger" role="alert">
                      {downloadError}
                    </Alert>
                  </div>
                )}
              </>
            ) : (
              <>
                <h2 className="text-base">
                  Buy this {TYPE_LABELS[item.type].toLowerCase()}
                </h2>
                <div className="mt-4">
                  <BuyButton
                    itemType="CONTENT_ITEM"
                    itemId={item.id}
                    label={item.title}
                    priceInPaise={item.priceInPaise}
                    onPaid={refreshOwnership}
                  />
                </div>
              </>
            )}
          </Card>
        </aside>
      </div>
    </article>
  );
}
