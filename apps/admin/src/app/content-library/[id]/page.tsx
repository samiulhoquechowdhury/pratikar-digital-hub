"use client";

import { Alert, Badge, Loading, PageBody, PageHeader } from "@pratikar/ui";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { ContentItemForm } from "@/features/content-library";
import {
  contentLibraryApi,
  type ContentItem,
} from "@/features/content-library/api/contentLibraryApi";
import { RequireStaff } from "@/shared/components/RequireStaff";

const STATUS_TONE = {
  PUBLISHED: "success",
  DRAFT: "warning",
  ARCHIVED: "neutral",
} as const;

const BackLink = () => (
  <Link
    href="/content-library"
    className="text-sm font-medium text-primary hover:text-primary-hover"
  >
    <span aria-hidden>←</span> All items
  </Link>
);

function EditContentItem({ id }: { id: string }) {
  const [item, setItem] = useState<ContentItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    contentLibraryApi
      .get(id)
      .then((result) => {
        if (!cancelled) setItem(result);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load that item.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (isLoading) {
    return (
      <PageBody>
        <Loading label="Loading item…" />
      </PageBody>
    );
  }

  if (error || !item) {
    return (
      <PageBody>
        <Alert tone="danger" role="alert">
          {error ?? "Item not found."}
        </Alert>
      </PageBody>
    );
  }

  return (
    <>
      <PageHeader title={item.title} actions={<BackLink />} />
      <PageBody className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone={STATUS_TONE[item.status]}>{item.status}</Badge>
          {item.status === "PUBLISHED" && (
            <span className="text-sm text-ink-muted">
              Live in the customer library — edits take effect immediately.
            </span>
          )}
        </div>

        <ContentItemForm existing={item} />
      </PageBody>
    </>
  );
}

export default function EditContentItemPage() {
  const params = useParams<{ id: string }>();

  return (
    <RequireStaff>
      <EditContentItem id={params.id} />
    </RequireStaff>
  );
}
