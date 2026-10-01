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
export function useContentItem(
  itemId: string,
  signedIn: boolean,
  /** The item as the page fetched it on the server, when it could. */
  initialItem?: ContentLibraryItem,
) {
  const [item, setItem] = useState<ContentLibraryItem | null>(
    initialItem ?? null,
  );
  const [isOwned, setIsOwned] = useState(false);
  const [isItemLoading, setIsItemLoading] = useState(!initialItem);
  // Starts true when signed in so an owner never sees "Buy" flash up before
  // "Download": the page counts as loading until both answers are in.
  const [isOwnershipLoading, setIsOwnershipLoading] = useState(signedIn);
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

  // The item is public; anyone can read what it is and what it costs.
  useEffect(() => {
    if (initialItem) return;
    let cancelled = false;
    setIsItemLoading(true);
    contentLibraryApi
      .get(itemId)
      .then((fetched) => {
        if (!cancelled) setItem(fetched);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load this item.");
      })
      .finally(() => {
        if (!cancelled) setIsItemLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // initialItem is fixed for the page's life; itemId stands for it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId]);

  // Ownership needs an account. Its own effect, so signing in on another tab
  // and coming back — or the session restoring a moment after load — swaps
  // Buy for Download without refetching the item.
  useEffect(() => {
    if (!signedIn) {
      setIsOwned(false);
      setIsOwnershipLoading(false);
      return;
    }
    let cancelled = false;
    setIsOwnershipLoading(true);
    loadOwnership()
      .then((owned) => {
        if (!cancelled) setIsOwned(owned);
      })
      // Left as "not owned" rather than shown as an error: the item itself
      // loaded fine, and the page is still usable. The cost is a Buy button
      // for something already owned until the next load.
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setIsOwnershipLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [signedIn, loadOwnership]);

  /** Called after a purchase confirms, so the page can swap Buy for Download. */
  const refreshOwnership = useCallback(() => {
    void loadOwnership().then(setIsOwned);
  }, [loadOwnership]);

  return {
    item,
    isOwned,
    isLoading: isItemLoading || isOwnershipLoading,
    error,
    refreshOwnership,
  };
}
