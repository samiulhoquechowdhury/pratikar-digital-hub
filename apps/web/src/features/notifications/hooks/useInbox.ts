"use client";

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/shared/providers/AuthProvider";

import { notificationsApi, type Inbox } from "../api/notificationsApi";

/** How often an open tab checks for news when no push arrives to say so. */
const POLL_MS = 60_000;

/**
 * The signed-in customer's inbox. Refreshed every minute, when the tab
 * comes back into view, and at once when the service worker reports a push.
 */
export function useInbox() {
  const { user } = useAuth();
  const [inbox, setInbox] = useState<Inbox>({ items: [], unread: 0 });

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      setInbox(await notificationsApi.inbox());
    } catch {
      // The bell is a convenience; a failed refresh keeps what it had.
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setInbox({ items: [], unread: 0 });
      return;
    }
    void refresh();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    const onWorkerMessage = (event: MessageEvent) => {
      if ((event.data as { type?: string } | null)?.type === "notification") {
        void refresh();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    navigator.serviceWorker?.addEventListener("message", onWorkerMessage);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      navigator.serviceWorker?.removeEventListener("message", onWorkerMessage);
    };
  }, [user, refresh]);

  const markRead = useCallback(
    async (ids?: string[]) => {
      // Optimistic: the dot disappears at the click, not a round trip later.
      setInbox((current) => {
        const now = new Date().toISOString();
        const items = current.items.map((item) =>
          !ids || ids.includes(item.id)
            ? { ...item, readAt: item.readAt ?? now }
            : item,
        );
        return { items, unread: items.filter((i) => !i.readAt).length };
      });
      try {
        await notificationsApi.markRead(ids);
      } catch {
        void refresh();
      }
    },
    [refresh],
  );

  return { inbox, refresh, markRead };
}
