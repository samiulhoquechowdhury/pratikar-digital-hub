"use client";

import type { ContentLibraryItem, ContentType } from "@pratikar/types";
import {
  Alert,
  Button,
  ButtonLink,
  EmptyState,
  SkeletonText,
} from "@pratikar/ui";
import { CheckCircle2, Download } from "lucide-react";
import { useState } from "react";

import { BuyButton } from "@/features/payments";
import { Icon } from "@/shared/components/Icon";
import {
  Breadcrumbs,
  FeatureList,
  ProductHeading,
  ProductLayout,
  ProductSection,
  PurchaseCard,
} from "@/shared/components/ProductPage";
import { CONTENT_CATEGORY_LABELS, CONTENT_KIND } from "@/shared/lib/labels";
import { LIBRARY_SHELVES } from "@/shared/lib/navigation";
import { useAuth } from "@/shared/providers/AuthProvider";

import { contentLibraryApi } from "../api/contentLibraryApi";
import { useContentItem } from "../hooks/useContentItem";

/**
 * The catalogue has no description column yet, so each format says what it
 * actually gets you. Worth replacing with real per-item copy once the model
 * has somewhere to put it.
 */
const ABOUT: Record<ContentType, { description: string; includes: string[] }> =
  {
    EBOOK: {
      description:
        "A long-form guide that explains the law in plain language — what applies to you, what to watch for, and what to do next.",
      includes: [
        "Downloadable file you keep",
        "Written for non-lawyers",
        "Download again any time",
        "Stays in your account",
      ],
    },
    CHECKLIST: {
      description:
        "A step-by-step reference sheet to print and work through, so nothing gets missed before you sign, file or register.",
      includes: [
        "Printable, step by step",
        "Covers the usual gaps",
        "Download again any time",
        "Stays in your account",
      ],
    },
    FORM: {
      description:
        "A ready-made form with the standard wording in place. Download it, fill in the blanks yourself, and print.",
      includes: [
        "Standard wording in place",
        "Editable Word document",
        "Download again any time",
        "Stays in your account",
      ],
    },
  };

export function ContentItemDetail({
  itemId,
  initialItem,
}: {
  itemId: string;
  /** The item as the page fetched it on the server, when it could. */
  initialItem?: ContentLibraryItem;
}) {
  const { user } = useAuth();
  const { item, isOwned, isLoading, error, refreshOwnership } = useContentItem(
    itemId,
    !!user,
    initialItem,
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

  if (isLoading) {
    return (
      <div className="mx-auto max-w-shell px-4 py-12 sm:px-6 lg:px-8">
        <SkeletonText lines={6} label="Loading this item…" />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="mx-auto max-w-shell px-4 py-12 sm:px-6 lg:px-8">
        {error ? (
          <Alert tone="danger" role="alert">
            {error}
          </Alert>
        ) : (
          <EmptyState
            title="This item isn't available"
            description="It may have been unpublished, or the link may be wrong."
            action={
              <ButtonLink href="/content-library">
                Back to the library
              </ButtonLink>
            }
          />
        )}
      </div>
    );
  }

  const shelf = LIBRARY_SHELVES.find((s) => s.type === item.type);
  const about = ABOUT[item.type];

  return (
    <ProductLayout
      header={
        <>
          <Breadcrumbs
            trail={[
              { href: "/content-library", label: "Library" },
              ...(shelf
                ? [
                    {
                      href: `/content-library?shelf=${shelf.slug}`,
                      label: shelf.label,
                    },
                  ]
                : []),
            ]}
            current={item.title}
          />

          <ProductHeading
            kind={CONTENT_KIND[item.type]}
            title={item.title}
            description={about.description}
            meta={[CONTENT_CATEGORY_LABELS[item.category]]}
          />
        </>
      }
      aside={
        <PurchaseCard>
          {isOwned ? (
            <div className="space-y-4">
              <p className="flex items-center gap-2 text-base font-semibold text-success-text">
                <Icon icon={CheckCircle2} />
                You own this
              </p>
              <p className="text-sm text-ink-muted">
                Download it as often as you need — it stays in your account.
              </p>
              <Button
                className="w-full"
                onClick={download}
                loading={isDownloading}
                loadingLabel="Preparing your download…"
              >
                <Icon icon={Download} />
                Download
              </Button>
              {downloadError && (
                <Alert tone="danger" role="alert">
                  {downloadError}
                </Alert>
              )}
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
        </PurchaseCard>
      }
    >
      <ProductSection title="What you get">
        <FeatureList items={about.includes} />
      </ProductSection>
    </ProductLayout>
  );
}
