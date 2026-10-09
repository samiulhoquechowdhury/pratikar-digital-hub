import type { AuthenticatedUser } from "@pratikar/types";

import { getAccessToken, setAccessToken } from "./authToken";

// Mirrors apps/web/src/shared/lib/apiClient, plus `put` — the admin app is the
// only client that edits resources. Kept as a copy rather than lifted into a
// shared package because the two will diverge: admin needs staff-specific
// error handling (403 on a role-gated route means "wrong account", not
// "logged out"), web doesn't.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: string,
  ) {
    super(`API error ${status}: ${body}`);
    this.name = "ApiError";
  }
}

export interface RefreshedSession {
  accessToken: string;
  user: AuthenticatedUser;
}

/**
 *   session    a new access token — keep working
 *   signed-out the refresh cookie is gone, expired or revoked
 *   failed     the refresh didn't get through; not a reason to sign out
 */
export type RefreshResult =
  | { kind: "session"; session: RefreshedSession }
  | { kind: "signed-out" }
  | { kind: "failed" };

type SessionListener = (session: RefreshedSession | null) => void;
const listeners = new Set<SessionListener>();

/** Tells AuthProvider when a refresh renews or ends the session. */
export function onSessionChange(listener: SessionListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

let inFlight: Promise<RefreshResult> | null = null;

/**
 * Exchanges the httpOnly refresh cookie for a new access token. One at a
 * time: a queue screen whose token expires sends several requests that all
 * 401 together, and they share the one refresh.
 */
export function refreshSession(): Promise<RefreshResult> {
  inFlight ??= (async (): Promise<RefreshResult> => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      // Any 4xx is the API refusing the cookie — missing (400), expired or
      // revoked (401). Only a 5xx or no answer at all is worth waiting out.
      if (res.status >= 400 && res.status < 500) {
        setAccessToken(null);
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

async function request<T>(
  path: string,
  init?: RequestInit,
  retry = true,
): Promise<T> {
  const accessToken = getAccessToken();
  // A FormData body sets its own multipart Content-Type, boundary included;
  // forcing JSON on it would make the upload unreadable.
  const isForm = init?.body instanceof FormData;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      ...(isForm ? {} : { "Content-Type": "application/json" }),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...init?.headers,
    },
  });

  // The access token lasts 15 minutes; a review can take longer. A 401 on a
  // request that carried one means it expired: renew it (refreshSession
  // stores the token and tells AuthProvider) and try once more. Not for
  // /auth/*, where renewing happens, nor for a request sent signed out.
  if (
    res.status === 401 &&
    retry &&
    accessToken &&
    !path.startsWith("/auth/")
  ) {
    const refreshed = await refreshSession();
    if (refreshed.kind === "session") return request<T>(path, init, false);
  }

  if (!res.ok) {
    throw new ApiError(res.status, await res.text());
  }

  // Endpoints returning void send 200 with an empty body, not 204 —
  // res.json() throws on empty input, so check the body rather than the status.
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    }),
  /** A multipart upload: one file under `field`. */
  upload: <T>(path: string, file: File, field = "file") => {
    const form = new FormData();
    form.append(field, file);
    return request<T>(path, { method: "POST", body: form });
  },
  // `del` rather than `delete`, which is a reserved word as a bare identifier.
  del: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
