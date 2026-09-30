import { scrubReport, withoutQuery } from "./scrub";

/** What must never reach the monitoring service. */
describe("scrubReport", () => {
  const report = () => ({
    request: {
      url: "https://api.pratikar.example/documents/d1/download?token=signed-abc",
      method: "POST",
      data: { code: "482913", identifier: "a@b.in" },
      cookies: { refreshToken: "rt-secret" },
      headers: { authorization: "Bearer at-secret", "user-agent": "x" },
      query_string: "token=signed-abc",
    },
    user: { id: "u1", email: "a@b.in", ip_address: "203.0.113.4" },
    breadcrumbs: [
      {
        category: "fetch",
        data: { url: "https://api.x/storage/f?sig=zzz", method: "GET" },
      },
      { category: "navigation", data: { from: "/a?q=rent", to: "/b" } },
      { category: "console", message: "hello" },
    ],
    exception: { values: [{ type: "TypeError" }] },
  });

  it("keeps only the method and the path of the request", () => {
    expect(scrubReport(report()).request).toEqual({
      url: "https://api.pratikar.example/documents/d1/download",
      method: "POST",
    });
  });

  it("drops sign-in codes, cookies and tokens entirely", () => {
    const json = JSON.stringify(scrubReport(report()));

    for (const secret of ["482913", "rt-secret", "at-secret", "signed-abc"]) {
      expect(json).not.toContain(secret);
    }
  });

  it("keeps the user's id and nothing that identifies them", () => {
    expect(scrubReport(report()).user).toEqual({ id: "u1" });
  });

  it("takes query strings off breadcrumb URLs", () => {
    const [fetchCrumb, navCrumb, consoleCrumb] =
      scrubReport(report()).breadcrumbs;

    expect(fetchCrumb!.data).toEqual({
      url: "https://api.x/storage/f",
      method: "GET",
    });
    expect(navCrumb!.data).toEqual({ from: "/a", to: "/b" });
    expect(consoleCrumb).toEqual({ category: "console", message: "hello" });
  });

  it("leaves the error itself alone", () => {
    expect(scrubReport(report()).exception).toEqual({
      values: [{ type: "TypeError" }],
    });
  });
});

describe("withoutQuery", () => {
  it.each([
    ["/a?b=c", "/a"],
    ["/a#frag", "/a"],
    ["/a", "/a"],
  ])("%s -> %s", (url, expected) => {
    expect(withoutQuery(url)).toBe(expected);
  });
});
