import { api } from "@/lib/api";

/** One inbox entry, as GET /notifications returns it. */
export interface InboxItem {
  id: string;
  title: string;
  body: string;
  /** A website path; the app maps it to its own screen. */
  href: string | null;
  readAt: string | null;
  createdAt: string;
}

export const notificationsApi = {
  inbox: () =>
    api.get<{ items: InboxItem[]; unread: number }>("/notifications"),
  markRead: (ids?: string[]) =>
    api.post<{ ok: true }>("/notifications/read", ids ? { ids } : {}),
  register: (token: string, platform: "android" | "ios") =>
    api.post<{ ok: true }>("/notifications/app-push/register", {
      token,
      platform,
    }),
  unregister: (token: string) =>
    api.post<{ ok: true }>("/notifications/app-push/unregister", { token }),
};
