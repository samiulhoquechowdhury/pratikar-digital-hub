import { apiClient } from "@/shared/lib/apiClient";

/** One inbox entry, as GET /notifications returns it. */
export interface InboxItem {
  id: string;
  title: string;
  body: string;
  /** A path on this site. */
  href: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface Inbox {
  items: InboxItem[];
  unread: number;
}

export const notificationsApi = {
  inbox: () => apiClient.get<Inbox>("/notifications"),

  /** Marks these read, or everything when no ids are given. */
  markRead: (ids?: string[]) =>
    apiClient.post<{ ok: true }>("/notifications/read", ids ? { ids } : {}),

  /** The server's VAPID public key, or null when push is switched off there. */
  pushKey: () =>
    apiClient.get<{ publicKey: string | null }>("/notifications/push/key"),

  subscribe: (subscription: PushSubscriptionJSON) =>
    apiClient.post<{ ok: true }>("/notifications/push/subscribe", subscription),

  unsubscribe: (endpoint: string) =>
    apiClient.post<{ ok: true }>("/notifications/push/unsubscribe", {
      endpoint,
    }),
};
