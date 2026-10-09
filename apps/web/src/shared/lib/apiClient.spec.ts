import { apiClient, onSessionChange } from "./apiClient";
import { getAccessToken, setAccessToken } from "./authToken";

const json = (status: number, body: unknown) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(JSON.stringify(body)),
    json: () => Promise.resolve(body),
  }) as Response;

const SESSION = {
  accessToken: "fresh",
  user: { id: "u1", name: "Asha", role: "CUSTOMER" },
};

/** fetch answers by path, in order; each call is recorded. */
function mockFetch(answers: Record<string, Response[]>) {
  const calls: { path: string; auth?: string }[] = [];
  global.fetch = jest.fn((url: string, init?: RequestInit) => {
    const path = new URL(url).pathname;
    const headers = (init?.headers ?? {}) as Record<string, string>;
    calls.push({ path, auth: headers.Authorization });
    const next = answers[path]?.shift();
    return Promise.resolve(next ?? json(500, {}));
  }) as unknown as typeof fetch;
  return calls;
}

describe("apiClient session refresh", () => {
  afterEach(() => setAccessToken(null));

  it("renews an expired token once and retries the request", async () => {
    setAccessToken("stale");
    const calls = mockFetch({
      "/notifications": [json(401, {}), json(200, { unread: 2 })],
      "/auth/refresh": [json(200, SESSION)],
    });

    await expect(apiClient.get("/notifications")).resolves.toEqual({
      unread: 2,
    });
    expect(calls.map((c) => c.path)).toEqual([
      "/notifications",
      "/auth/refresh",
      "/notifications",
    ]);
    expect(calls[2]!.auth).toBe("Bearer fresh");
    expect(getAccessToken()).toBe("fresh");
  });

  // Everything on the page expires together; one refresh serves them all.
  it("shares one refresh between requests that expire together", async () => {
    setAccessToken("stale");
    const calls = mockFetch({
      "/a": [json(401, {}), json(200, "a")],
      "/b": [json(401, {}), json(200, "b")],
      "/auth/refresh": [json(200, SESSION)],
    });

    await Promise.all([apiClient.get("/a"), apiClient.get("/b")]);

    expect(calls.filter((c) => c.path === "/auth/refresh")).toHaveLength(1);
  });

  it("signs out when the session has ended, and reports the 401", async () => {
    setAccessToken("stale");
    mockFetch({
      "/documents/mine": [json(401, {})],
      "/auth/refresh": [json(401, {})],
    });
    const listener = jest.fn();
    const stop = onSessionChange(listener);

    await expect(apiClient.get("/documents/mine")).rejects.toThrow(
      "API error 401",
    );
    expect(getAccessToken()).toBeNull();
    expect(listener).toHaveBeenCalledWith(null);
    stop();
  });

  // No refresh cookie at all (cleared in another tab) is answered with 400.
  it("signs out when the refresh cookie is missing", async () => {
    setAccessToken("stale");
    mockFetch({ "/x": [json(401, {})], "/auth/refresh": [json(400, {})] });

    await expect(apiClient.get("/x")).rejects.toThrow("API error 401");
    expect(getAccessToken()).toBeNull();
  });

  // A network blip on the refresh is not a reason to sign anyone out.
  it("keeps the session when the refresh itself fails", async () => {
    setAccessToken("stale");
    mockFetch({ "/x": [json(401, {})], "/auth/refresh": [json(503, {})] });

    await expect(apiClient.get("/x")).rejects.toThrow("API error 401");
    expect(getAccessToken()).toBe("stale");
  });

  it("doesn't refresh for a request made signed out", async () => {
    const calls = mockFetch({ "/notifications": [json(401, {})] });

    await expect(apiClient.get("/notifications")).rejects.toThrow();
    expect(calls).toHaveLength(1);
  });
});
