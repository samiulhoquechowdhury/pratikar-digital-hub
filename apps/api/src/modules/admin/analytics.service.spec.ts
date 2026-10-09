import type { PrismaService } from "../../prisma/prisma.service";

import { AnalyticsService, istDay, periodDays } from "./analytics.service";

describe("istDay", () => {
  // 20:00 UTC is already the next day in India (+05:30).
  it("dates by the day in India, not UTC", () => {
    expect(istDay(new Date("2026-10-05T20:00:00Z"))).toBe("2026-10-06");
    expect(istDay(new Date("2026-10-05T18:00:00Z"))).toBe("2026-10-05");
  });
});

describe("periodDays", () => {
  it("lists every day of the period, oldest first, ending today", () => {
    expect(periodDays(3, new Date("2026-10-06T06:00:00Z"))).toEqual([
      "2026-10-04",
      "2026-10-05",
      "2026-10-06",
    ]);
  });
});

describe("AnalyticsService.overview", () => {
  const build = () => {
    const prisma = {
      order: {
        aggregate: jest
          .fn()
          // paid, then refunded
          .mockResolvedValueOnce({
            _count: 3,
            _sum: { amount: 30_000, gstAmount: 5_400 },
          })
          .mockResolvedValueOnce({
            _count: 1,
            _sum: { amount: 10_000, gstAmount: 1_800 },
          }),
        groupBy: jest
          .fn()
          // by item type, then top library items
          .mockResolvedValueOnce([
            {
              itemType: "DOCUMENT",
              _count: 1,
              _sum: { amount: 10_000, gstAmount: 1_800 },
            },
            {
              itemType: "CONTENT_ITEM",
              _count: 2,
              _sum: { amount: 20_000, gstAmount: 3_600 },
            },
          ])
          .mockResolvedValueOnce([
            {
              contentLibraryItemId: "i-1",
              _count: 2,
              _sum: { amount: 20_000, gstAmount: 3_600 },
            },
          ]),
      },
      $queryRaw: jest
        .fn()
        .mockResolvedValue([
          { day: "2026-10-05", orders: BigInt(3), gross: BigInt(35_400) },
        ]),
      generatedDocument: {
        count: jest.fn().mockResolvedValueOnce(5).mockResolvedValueOnce(2),
        groupBy: jest
          .fn()
          .mockResolvedValueOnce([{ templateId: "t-1", _count: 5 }])
          .mockResolvedValueOnce([{ templateId: "t-1", _count: 2 }]),
      },
      user: { count: jest.fn().mockResolvedValue(4) },
      documentReview: { count: jest.fn().mockResolvedValue(1) },
      template: {
        findMany: jest
          .fn()
          .mockResolvedValue([{ id: "t-1", title: "Rent Agreement" }]),
      },
      contentLibraryItem: {
        findMany: jest
          .fn()
          .mockResolvedValue([{ id: "i-1", title: "Sale Deed", type: "FORM" }]),
      },
    };
    return {
      service: new AnalyticsService(prisma as unknown as PrismaService),
      prisma,
    };
  };

  it("adds GST into revenue and reports refunds apart from it", async () => {
    const { service } = build();

    const result = await service.overview(7, new Date("2026-10-06T06:00:00Z"));

    expect(result.revenue).toEqual({
      grossPaise: 35_400,
      gstPaise: 5_400,
      orders: 3,
      averageOrderPaise: 11_800,
    });
    expect(result.refunds).toEqual({ orders: 1, grossPaise: 11_800 });
    // Largest earner first.
    expect(result.byType.map((t) => t.itemType)).toEqual([
      "CONTENT_ITEM",
      "DOCUMENT",
    ]);
  });

  it("fills every day of the period, zero where nothing sold", async () => {
    const { service } = build();

    const { daily } = await service.overview(
      7,
      new Date("2026-10-06T06:00:00Z"),
    );

    expect(daily).toHaveLength(7);
    expect(daily.find((d) => d.day === "2026-10-05")).toEqual({
      day: "2026-10-05",
      orders: 3,
      grossPaise: 35_400,
    });
    expect(daily.find((d) => d.day === "2026-10-06")?.orders).toBe(0);
  });

  it("names the top templates and items, with how many converted", async () => {
    const { service } = build();

    const result = await service.overview(7, new Date("2026-10-06T06:00:00Z"));

    expect(result.topTemplates).toEqual([
      { templateId: "t-1", title: "Rent Agreement", generated: 5, paid: 2 },
    ]);
    expect(result.topLibraryItems).toEqual([
      {
        id: "i-1",
        title: "Sale Deed",
        type: "FORM",
        orders: 2,
        grossPaise: 23_600,
      },
    ]);
    expect(result.documents).toEqual({ generated: 5, paid: 2 });
  });
});
