import { getAccessToken } from "./authToken";

// Thin fetch wrapper: base URL, credentials (cookies for the httpOnly refresh
// token), and a single place to hook in access-token refresh-on-401 later.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

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
};
