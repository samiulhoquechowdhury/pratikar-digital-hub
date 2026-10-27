import type { PrismaService } from "../../prisma/prisma.service";
import type { AuditService } from "../audit/audit.service";

import { CouponsService } from "./coupons.service";

const COUPON = {
  id: "cpn-1",
  code: "LAUNCH20",
  description: "Launch offer",
  kind: "PERCENT",
  value: 20,
  maxDiscountInPaise: null,
  minOrderInPaise: null,
  appliesTo: [],
  startsAt: null,
  endsAt: null,
  maxRedemptions: 2,
  perUserLimit: 1,
  active: true,
};

const build = (coupon: unknown, counts: [number, number]) => {
  const prisma = {
    coupon: { findUnique: jest.fn().mockResolvedValue(coupon) },
    order: {
      count: jest
        .fn()
        .mockResolvedValueOnce(counts[0])
        .mockResolvedValueOnce(counts[1]),
    },
  };
  const service = new CouponsService(
    prisma as unknown as PrismaService,
    {} as AuditService,
  );
  return { service, prisma };
};

describe("CouponsService.apply", () => {
  it("looks the code up upper-case and returns the discount", async () => {
    const { service, prisma } = build(COUPON, [0, 0]);

    const applied = await service.apply(
      " launch20 ",
      "cust-1",
      "CONTENT_ITEM",
      12_627,
    );

    expect(prisma.coupon.findUnique).toHaveBeenCalledWith({
      where: { code: "LAUNCH20" },
    });
    expect(applied.discountInPaise).toBe(2_525);
  });

  it("counts only paid orders as uses", async () => {
    const { service, prisma } = build(COUPON, [0, 0]);
    await service.apply("LAUNCH20", "cust-1", "CONTENT_ITEM", 12_627);

    const calls = prisma.order.count.mock.calls as unknown as [
      { where: Record<string, unknown> },
    ][];
    expect(calls[0]?.[0].where).toEqual({ couponId: "cpn-1", status: "PAID" });
    expect(calls[1]?.[0].where).toEqual({
      couponId: "cpn-1",
      status: "PAID",
      userId: "cust-1",
    });
  });

  it("names an unknown code", async () => {
    const { service } = build(null, [0, 0]);
    await expect(
      service.apply("NOPE", "cust-1", "CONTENT_ITEM", 12_627),
    ).rejects.toThrow("COUPON_NOT_FOUND");
  });

  it("refuses a code that is used up", async () => {
    const { service } = build(COUPON, [2, 0]);
    await expect(
      service.apply("LAUNCH20", "cust-1", "CONTENT_ITEM", 12_627),
    ).rejects.toThrow("COUPON_USED_UP");
  });

  it("refuses a second use by the same customer", async () => {
    const { service } = build(COUPON, [1, 1]);
    await expect(
      service.apply("LAUNCH20", "cust-1", "CONTENT_ITEM", 12_627),
    ).rejects.toThrow("COUPON_ALREADY_USED");
  });
});
