"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { ContentItemForm } from "@/features/content-library";
import {
  contentLibraryApi,
  type ContentItem,
} from "@/features/content-library/api/contentLibraryApi";
import { RequireStaff } from "@/shared/components/RequireStaff";

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

  if (isLoading) return <p>Loading item…</p>;
  if (error) return <p role="alert">{error}</p>;
  if (!item) return <p role="alert">Item not found.</p>;

  return (
    <>
      <h1>{item.title}</h1>
      <p>{item.status}</p>
      <ContentItemForm existing={item} />
    </>
  );
}

export default function EditContentItemPage() {
  const params = useParams<{ id: string }>();

  return (
    <RequireStaff>
      <main>
        <p>
          <Link href="/content-library">← Content library</Link>
        </p>
        <EditContentItem id={params.id} />
      </main>
    </RequireStaff>
  );
}
