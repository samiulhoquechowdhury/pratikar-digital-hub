import { StorageService } from "./storage.service";

/**
 * Signed download URLs are what stands between a paid object and anyone who
 * can guess its key: StorageController has no auth guard, so every paywall in
 * the product terminates in verifyDownloadUrl returning false.
 */
describe("StorageService download URLs", () => {
  const originalEnv = process.env;

  // null rather than undefined for "no secret": passing undefined would just
  // trigger the default parameter and quietly test the configured case twice.
  const build = (secret: string | null = "storage-secret") => {
    process.env = { ...originalEnv, PORT: "4000" };
    if (secret === null) delete process.env.STORAGE_URL_SECRET;
    else process.env.STORAGE_URL_SECRET = secret;
    return new StorageService();
  };

  const parse = (url: string) => {
    const parsed = new URL(url);
    return {
      key: decodeURIComponent(parsed.pathname.replace(/^\/storage\//, "")),
      exp: parsed.searchParams.get("exp") ?? "",
      sig: parsed.searchParams.get("sig") ?? "",
    };
  };

  afterEach(() => {
    process.env = originalEnv;
  });

  it("accepts a URL it just minted", () => {
    const service = build();
    const { key, exp, sig } = parse(service.signUrl("documents/abc.pdf"));

    expect(service.verifyDownloadUrl(key, exp, sig)).toBe(true);
  });

  /**
   * The attack the signature exists to stop: take a link to something you did
   * buy and edit the path to something you didn't.
   */
  it("rejects a signature reused for a different key", () => {
    const service = build();
    const { exp, sig } = parse(service.signUrl("documents/mine.pdf"));

    expect(
      service.verifyDownloadUrl("documents/someone-else.pdf", exp, sig),
    ).toBe(false);
  });

  // Extending the deadline must invalidate the signature, or expiry is
  // advisory and a leaked link never dies.
  it("rejects an expiry edited to a later time", () => {
    const service = build();
    const { key, exp, sig } = parse(service.signUrl("documents/abc.pdf"));
    const later = String(Number(exp) + 86_400_000);

    expect(service.verifyDownloadUrl(key, later, sig)).toBe(false);
  });

  it("rejects a link whose expiry has passed", () => {
    const service = build();
    const { key, exp, sig } = parse(
      service.signUrl("documents/abc.pdf", -1000),
    );

    expect(Number(exp)).toBeLessThan(Date.now());
    expect(service.verifyDownloadUrl(key, exp, sig)).toBe(false);
  });

  it("rejects a missing or malformed signature", () => {
    const service = build();
    const { key, exp } = parse(service.signUrl("documents/abc.pdf"));

    expect(service.verifyDownloadUrl(key, exp, "")).toBe(false);
    expect(service.verifyDownloadUrl(key, exp, "deadbeef")).toBe(false);
    expect(service.verifyDownloadUrl(key, "not-a-number", "x")).toBe(false);
  });

  /**
   * An empty secret is worse than no signing at all: the HMAC still verifies,
   * so the system looks protected while anyone can compute a valid link.
   */
  it("refuses to sign when no secret is configured", () => {
    const service = build(null);

    expect(() => service.signUrl("documents/abc.pdf")).toThrow(
      /STORAGE_URL_SECRET/,
    );
  });

  /**
   * Rows written before download URLs were signed stored a full URL in
   * fileUrl rather than a key. Those still have to resolve, or every document
   * generated before the change becomes undownloadable.
   */
  it("signs a legacy stored URL as though it were a bare key", () => {
    const service = build();
    const legacy = service.signUrl(
      "http://localhost:4000/storage/documents/a.pdf",
    );
    const fresh = service.signUrl("documents/a.pdf");

    expect(parse(legacy).key).toBe("documents/a.pdf");
    expect(parse(legacy).key).toBe(parse(fresh).key);
  });
});
