import robots from "../robots";

describe("robots", () => {
  const original = process.env;
  afterEach(() => {
    process.env = original;
  });

  // Staging runs the same code; without the opt-in it must not be indexed.
  it("blocks everything unless indexing is switched on", () => {
    process.env = { ...original };
    delete process.env.ALLOW_SEARCH_INDEXING;

    expect(robots().rules).toEqual({ userAgent: "*", disallow: "/" });
  });

  it("opens the site, keeps private pages out, and names the sitemap", () => {
    process.env = {
      ...original,
      ALLOW_SEARCH_INDEXING: "true",
      NEXT_PUBLIC_SITE_URL: "https://pratikar.example",
    };

    const result = robots();

    expect(result.rules).toMatchObject({
      allow: "/",
      disallow: expect.arrayContaining([
        "/dashboard",
        "/learn/",
        "/login",
      ]) as unknown,
    });
    expect(result.sitemap).toBe("https://pratikar.example/sitemap.xml");
  });
});
