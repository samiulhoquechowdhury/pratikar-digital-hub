import type { AuthenticatedUser } from "@pratikar/types";

import { getAccessToken, setAccessToken } from "./authToken";

// Thin fetch wrapper: base URL, credentials (cookies for the httpOnly refresh
// token), and renewing the access token when it expires mid-visit.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export interface RefreshedSession {
  accessToken: string;
  user: AuthenticatedUser;
}

/**
 *   session    a new access token — the visit carries on
 *   signed-out the refresh cookie is gone, expired or revoked
 *   failed     the refresh itself didn't get through (network, server) —
 *              not a reason to sign anyone out
 */
export type RefreshResult =
  | { kind: "session"; session: RefreshedSession }
  | { kind: "signed-out" }
  | { kind: "failed" };

type SessionListener = (session: RefreshedSession | null) => void;
const listeners = new Set<SessionListener>();

/**
 * Tells AuthProvider when a refresh renews or ends the session, so the
 * header and every page follow it — a refresh can happen inside any call.
 */
export function onSessionChange(listener: SessionListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

let inFlight: Promise<RefreshResult> | null = null;

/**
 * Exchanges the httpOnly refresh cookie for a new access token.
 *
 * One at a time: when the token expires, every request made in that moment
 * gets a 401 together — the bell, the page, a poll — and they all wait on
 * the same refresh rather than sending one each.
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

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...init?.headers,
    },
  });

  // The access token lasts 15 minutes; a visit can last longer. A 401 on a
  // request that carried one means it expired — renew it and try once more.
  // Not for /auth/* (that's where renewing happens), and not for a request
  // sent signed out, whose 401 is the real answer.
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
    throw new Error(`API error ${res.status}: ${await res.text()}`);
  }

  // Endpoints returning void (e.g. POST /auth/otp/request) send 200 with an
  // empty body, not 204 — res.json() throws on empty input, so check the body
  // rather than trusting status code alone.
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
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    }),
  // Added for saving quiz answers as a learner goes: each save replaces that
  // one question's answer, which is a PUT rather than a POST.
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    }),
};
