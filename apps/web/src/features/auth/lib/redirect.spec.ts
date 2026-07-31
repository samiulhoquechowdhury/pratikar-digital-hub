import { DEFAULT_SIGNED_IN_PATH, safeRedirectPath } from "./redirect";

/**
 * The sign-in pages send you wherever `?next=` says. That parameter is
 * attacker-controlled by construction — it lives in a URL anyone can compose
 * and send — so each case below is a link someone could put in an email, with
 * our domain in front of it, to land a victim on a login form they don't own.
 */
describe("safeRedirectPath", () => {
  it("keeps a same-site path", () => {
    expect(safeRedirectPath("/courses/abc")).toBe("/courses/abc");
  });

  it("keeps a path with a query string", () => {
    expect(safeRedirectPath("/search?q=rent")).toBe("/search?q=rent");
  });

  it.each([
    ["nothing", null],
    ["an empty string", ""],
  ])("falls back to the dashboard given %s", (_label, value) => {
    expect(safeRedirectPath(value)).toBe(DEFAULT_SIGNED_IN_PATH);
  });

  it("rejects an absolute URL to another origin", () => {
    expect(safeRedirectPath("https://evil.example/login")).toBe(
      DEFAULT_SIGNED_IN_PATH,
    );
  });

  /**
   * The one a naive `startsWith("/")` check lets through. Browsers read
   * "//evil.example" as "https://evil.example" — it is an absolute URL that
   * happens to begin with a slash.
   */
  it("rejects a protocol-relative URL", () => {
    expect(safeRedirectPath("//evil.example/login")).toBe(
      DEFAULT_SIGNED_IN_PATH,
    );
  });

  // Same trick, spelled with a backslash — some browsers normalise it.
  it("rejects a backslash-prefixed URL", () => {
    expect(safeRedirectPath("/\\evil.example")).toBe(DEFAULT_SIGNED_IN_PATH);
  });

  it("rejects a scheme-only redirect", () => {
    expect(safeRedirectPath("javascript:alert(1)")).toBe(
      DEFAULT_SIGNED_IN_PATH,
    );
  });
});
