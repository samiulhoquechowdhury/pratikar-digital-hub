"use client";

import type { ContentLibraryItem } from "@pratikar/types";
import { useCallback, useEffect, useState } from "react";

import { apiClient } from "@/shared/lib/apiClient";

import { contentLibraryApi } from "../api/contentLibraryApi";

/**
 * An item plus whether the signed-in user already owns it.
 *
 * Ownership is read from the user's own orders rather than by probing the
 * download endpoint: that endpoint has a side effect on documents (it consumes
 * a one-time link) and calling it just to render a button would be a poor
 * habit to establish. It stays a display concern either way — the server
 * re-checks entitlement when the download is actually requested.
 */
export function useContentItem(itemId: string, enabled = true) {
  const [item, setItem] = useState<ContentLibraryItem | null>(null);
  const [isOwned, setIsOwned] = useState(false);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const loadOwnership = useCallback(async () => {
    const orders =
      await apiClient.get<
        { status: string; contentLibraryItem: { id: string } | null }[]
      >("/orders/mine");
    return orders.some(
      (order) =>
        order.status === "PAID" && order.contentLibraryItem?.id === itemId,
    );
  }, [itemId]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    Promise.all([contentLibraryApi.get(itemId), loadOwnership()])
      .then(([fetched, owned]) => {
        if (cancelled) return;
        setItem(fetched);
        setIsOwned(owned);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load this item.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [itemId, enabled, loadOwnership]);

  /** Called after a purchase confirms, so the page can swap Buy for Download. */
  const refreshOwnership = useCallback(() => {
    void loadOwnership().then(setIsOwned);
  }, [loadOwnership]);

  return { item, isOwned, isLoading, error, refreshOwnership };
}
