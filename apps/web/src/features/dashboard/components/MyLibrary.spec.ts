import type { CustomerOrder } from "@pratikar/types";

import { ownedLibraryItems } from "./MyLibrary";

const order = (
  id: string,
  status: CustomerOrder["status"],
  item: { id: string; title: string } | null,
  createdAt = "2026-09-01T00:00:00Z",
) =>
  ({
    id,
    status,
    createdAt,
    itemType: item ? "CONTENT_ITEM" : "COURSE",
    contentLibraryItem: item,
  }) as CustomerOrder;

const SALE_DEED = { id: "i-1", title: "Sale Deed" };

describe("ownedLibraryItems", () => {
  it("lists library items from paid orders", () => {
    expect(ownedLibraryItems([order("o-1", "PAID", SALE_DEED)])).toEqual([
      { ...SALE_DEED, boughtAt: "2026-09-01T00:00:00Z" },
    ]);
  });

  // The PAID order is the entitlement; anything else owns nothing.
  it.each(["PENDING", "FAILED", "REFUNDED"] as const)(
    "leaves out a %s order",
    (status) => {
      expect(ownedLibraryItems([order("o-1", status, SALE_DEED)])).toEqual([]);
    },
  );

  it("shows an item bought twice once", () => {
    const items = ownedLibraryItems([
      order("o-2", "PAID", SALE_DEED, "2026-09-05T00:00:00Z"),
      order("o-1", "PAID", SALE_DEED),
    ]);
    expect(items).toHaveLength(1);
  });

  it("ignores orders for courses and documents", () => {
    expect(ownedLibraryItems([order("o-1", "PAID", null)])).toEqual([]);
  });
});
