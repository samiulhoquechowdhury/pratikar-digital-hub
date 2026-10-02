import { isActive, legacyHashTarget } from "./accountNav";

describe("isActive", () => {
  it("matches the dashboard only on the dashboard itself", () => {
    expect(isActive("/dashboard", "/dashboard")).toBe(true);
    expect(isActive("/dashboard", "/dashboard/orders")).toBe(false);
  });

  it("matches a section and anything beneath it", () => {
    expect(isActive("/dashboard/orders", "/dashboard/orders")).toBe(true);
    expect(isActive("/dashboard/orders", "/dashboard/orders/123")).toBe(true);
    expect(isActive("/dashboard/orders", "/dashboard/ordersx")).toBe(false);
  });
});

// Links in emails already sent point at the old tabbed page.
describe("legacyHashTarget", () => {
  it.each([
    ["#documents", "/dashboard/documents"],
    ["#courses", "/dashboard/courses"],
    ["#purchases", "/dashboard/orders"],
  ])("sends %s to %s", (hash, target) => {
    expect(legacyHashTarget(hash)).toBe(target);
  });

  it("leaves anything else alone", () => {
    expect(legacyHashTarget("")).toBeNull();
    expect(legacyHashTarget("#top")).toBeNull();
  });
});
