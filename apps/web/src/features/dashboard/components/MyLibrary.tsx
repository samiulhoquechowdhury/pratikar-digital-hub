"use client";

import type { CustomerOrder } from "@pratikar/types";
import { Button, ButtonLink, EmptyState } from "@pratikar/ui";
import { BookOpen, Download } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { contentLibraryApi } from "@/features/content-library/api/contentLibraryApi";
import { Icon } from "@/shared/components/Icon";

/**
 * Library items the customer has paid for, each one a click from its file.
 *
 * Owned items are read from paid orders — a PAID order for an item *is* the
 * entitlement (there's no separate ownership row), so a refunded order drops
 * off this list by itself. Two orders for the same item show it once.
 */
export function ownedLibraryItems(orders: CustomerOrder[]) {
  const seen = new Map<
    string,
    { id: string; title: string; boughtAt: string }
  >();
  for (const order of orders) {
    const item = order.contentLibraryItem;
    if (order.status !== "PAID" || !item || seen.has(item.id)) continue;
    seen.set(item.id, { ...item, boughtAt: order.createdAt });
  }
  return [...seen.values()];
}

export function MyLibrary({ orders }: { orders: CustomerOrder[] }) {
  const items = ownedLibraryItems(orders);

  if (items.length === 0) {
    return (
      <EmptyState
        title="Your library is empty"
        description="E-books, checklists and forms you buy appear here, ready to download again whenever you need them."
        action={
          <ButtonLink href="/content-library">Browse the library</ButtonLink>
        }
      />
    );
  }

  return (
    <ul className="divide-y divide-line rounded-card border border-line bg-surface">
      {items.map((item) => (
        <LibraryRow key={item.id} {...item} />
      ))}
    </ul>
  );
}

function LibraryRow({
  id,
  title,
  boughtAt,
}: {
  id: string;
  title: string;
  boughtAt: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const download = () => {
    setBusy(true);
    setError(null);
    contentLibraryApi
      .download(id)
      .then(({ fileUrl }) => {
        // Signed and short-lived, so fetched at click time and never kept.
        window.location.href = fileUrl;
      })
      .catch(() => setError("Couldn't start the download. Please try again."))
      .finally(() => setBusy(false));
  };

  return (
    <li className="flex flex-wrap items-center gap-4 px-4 py-4">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-control bg-primary-subtle text-primary">
        <Icon icon={BookOpen} size="md" />
      </span>
      <span className="min-w-0 flex-1">
        <Link
          href={`/content-library/${id}`}
          className="block truncate font-medium text-ink hover:text-primary"
        >
          {title}
        </Link>
        <span className="block text-xs text-ink-muted">
          Bought{" "}
          {new Date(boughtAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
        {error && (
          <span role="alert" className="mt-1 block text-xs text-danger-text">
            {error}
          </span>
        )}
      </span>
      <Button size="sm" variant="secondary" onClick={download} disabled={busy}>
        <Icon icon={Download} />
        {busy ? "Preparing…" : "Download"}
      </Button>
    </li>
  );
}
