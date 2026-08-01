import { getAccessToken } from "./authToken";

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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
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

  if (!res.ok) {
    // TODO: on 401, attempt one refresh via /auth/refresh, then retry once.
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
  // `del` rather than `delete`, which is a reserved word as a bare identifier.
  del: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
