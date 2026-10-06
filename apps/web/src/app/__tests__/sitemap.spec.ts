import { serverGet } from "@/shared/lib/serverApi";

jest.mock("@/shared/lib/serverApi", () => ({
  ...jest.requireActual<object>("@/shared/lib/serverApi"),
  serverGet: jest.fn(),
}));

const mockedGet = jest.mocked(serverGet);

/** Loads the sitemap with the courses switch set, fresh each time. */
const sitemapWith = async (coursesLive: boolean) => {
  process.env.NEXT_PUBLIC_COURSES_LIVE = coursesLive ? "true" : "false";
  let mod!: typeof import("../sitemap");
  await jest.isolateModulesAsync(async () => {
    mod = await import("../sitemap");
  });
  return mod.default();
};

describe("sitemap", () => {
  beforeEach(() => {
    mockedGet.mockImplementation((path: string) =>
      Promise.resolve({
        status: "ok",
        data:
          path === "/courses"
            ? [{ id: "c-1", createdAt: "2026-09-01T00:00:00Z" }]
            : [],
      } as never),
    );
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_COURSES_LIVE;
  });

  // Every course page says "coming soon" until courses go live.
  it("leaves course pages out while courses are coming soon", async () => {
    const urls = (await sitemapWith(false)).map((entry) => entry.url);
    expect(urls.some((url) => url.includes("/courses/c-1"))).toBe(false);
  });

  it("lists them once courses are live", async () => {
    const urls = (await sitemapWith(true)).map((entry) => entry.url);
    expect(urls.some((url) => url.includes("/courses/c-1"))).toBe(true);
  });
});
