import type { AuthenticatedUser } from "@pratikar/types";

import { API_URL } from "./config";
import {
  clearRefreshToken,
  getAccessToken,
  readRefreshToken,
  setAccessToken,
} from "./session";

// The app's counterpart to apps/web/src/shared/lib/apiClient.ts. The one
// real difference: there is no cookie jar, so the refresh token travels in
// the body of /auth/refresh, read from the Keystore — and every request
// carries the header that tells the API to hand that token back on sign-in.
export const APP_CLIENT_HEADERS = { "X-Pratikar-Client": "android" } as const;

/**
 * What the API threw: its status, the `message` it sent, and the raw body.
 * The message reads `API error <status>: <body>`, exactly as the website's
 * client throws it, so helpers that parse it (coupon problems, refused
 * answers) work unchanged in both apps.
 */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    readonly body: string,
  ) {
    super(`API error ${status}: ${body}`);
  }
}

export interface RefreshedSession {
  accessToken: string;
  user: AuthenticatedUser;
}

/**
 *   session    a new access token — carry on
 *   signed-out no stored token, or the API refused it (expired, revoked)
 *   failed     the refresh didn't get through (offline, server down) — not
 *              a reason to sign anyone out
 */
export type RefreshResult =
  | { kind: "session"; session: RefreshedSession }
  | { kind: "signed-out" }
  | { kind: "failed" };

type SessionListener = (session: RefreshedSession | null) => void;
const listeners = new Set<SessionListener>();

/** Tells AuthProvider when a refresh inside any call renews or ends the session. */
export function onSessionChange(listener: SessionListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

let inFlight: Promise<RefreshResult> | null = null;

/**
 * Exchanges the stored refresh token for a new access token. One at a time:
 * when the token expires, every request in flight gets a 401 together, and
 * they all wait on the same refresh.
 */
export function refreshSession(): Promise<RefreshResult> {
  inFlight ??= (async (): Promise<RefreshResult> => {
    const refreshToken = await readRefreshToken().catch(() => null);
    if (!refreshToken) return { kind: "signed-out" };
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...APP_CLIENT_HEADERS },
        body: JSON.stringify({ refreshToken }),
      });
      // A 4xx is the API refusing the token — expired or revoked. Only a 5xx
      // or no answer at all is worth waiting out.
      if (res.status >= 400 && res.status < 500) {
        setAccessToken(null);
        await clearRefreshToken().catch(() => undefined);
        listeners.forEach((listener) => listener(null));
        return { kind: "signed-out" };
      }
      if (!res.ok) return { kind: "failed" };
      const session = (await res.json()) as RefreshedSession;
      setAccessToken(session.accessToken);
      listeners.forEach((listener) => listener(session));
      return { kind: "session", session };
    } catch {
      return { kind: "failed" };
    }
  })().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

/** The `message` NestJS puts in an error body, e.g. "NOT_PURCHASED". */
const errorCode = (body: string): string => {
  try {
    const parsed = JSON.parse(body) as { message?: unknown };
    if (typeof parsed.message === "string") return parsed.message;
    if (Array.isArray(parsed.message)) return String(parsed.message[0] ?? "");
  } catch {
    // Not JSON — a proxy's error page, say.
  }
  return "";
};

export async function request<T>(
  path: string,
  init?: RequestInit,
  retry = true,
): Promise<T> {
  const accessToken = getAccessToken();

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...APP_CLIENT_HEADERS,
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...init?.headers,
    },
  });

  // The access token lasts 15 minutes and the app stays open far longer.
  // A 401 on a request that carried one means it expired: renew, retry once.
  if (
    res.status === 401 &&
    retry &&
    accessToken &&
    !path.startsWith("/auth/")
  ) {
    const refreshed = await refreshSession();
    if (refreshed.kind === "session") return request<T>(path, init, false);
  }

  const text = await res.text();
  if (!res.ok) throw new ApiError(res.status, errorCode(text), text);
  // Void endpoints answer 200 with an empty body.
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

const withBody = (method: string, body?: unknown): RequestInit => ({
  method,
  body: body === undefined ? undefined : JSON.stringify(body),
});

export const api = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, withBody("POST", body)),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, withBody("PATCH", body)),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, withBody("PUT", body)),
  del: <T>(path: string, body?: unknown) =>
    request<T>(path, withBody("DELETE", body)),
};
