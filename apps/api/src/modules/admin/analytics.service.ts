import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";

/** The periods the dashboard offers, in days. */
export const ANALYTICS_PERIODS = [7, 30, 90, 365] as const;
export type AnalyticsPeriod = (typeof ANALYTICS_PERIODS)[number];

/** How many rows each "top" list returns. */
const TOP_N = 8;

const DAY_MS = 24 * 3600 * 1000;
/** India has no daylight saving, so a fixed offset is exact. */
const IST_OFFSET_MS = 330 * 60 * 1000;

/** A date as the day it was in India, "YYYY-MM-DD". */
export const istDay = (date: Date) =>
  new Date(date.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);

/**
 * The days of a period, oldest first, ending today in India — every day,
 * including the ones with no sales, so a chart's gaps are real gaps.
 */
export function periodDays(days: number, now = new Date()): string[] {
  return Array.from({ length: days }, (_, i) =>
    istDay(new Date(now.getTime() - (days - 1 - i) * DAY_MS)),
  );
}

interface DailyRow {
  day: string;
  orders: bigint;
  gross: bigint | null;
}

/**
 * The numbers behind the admin dashboard (docs/srs.md 3.2, 3.4, 3.10): what
 * sold, what was generated, who joined — over a chosen period.
 *
 * Revenue is PAID orders only, GST included, as the customer paid it; a
 * refunded order has left revenue and is counted under refunds instead.
 * Orders are dated by when they were placed, which for a paid order is
 * within seconds of the payment.
 */
@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async overview(days: AnalyticsPeriod, now = new Date()) {
    const dayList = periodDays(days, now);
    // From the start of the first day, in India.
    const since = new Date(
      Date.parse(`${dayList[0]}T00:00:00.000Z`) - IST_OFFSET_MS,
    );
    const inPeriod = { gte: since, lte: now };

    const [
      paid,
      refunded,
      byType,
      daily,
      generated,
      generatedPaid,
      templateCounts,
      templatePaidCounts,
      libraryCounts,
      newCustomers,
      reviewsWaiting,
    ] = await Promise.all([
      this.prisma.order.aggregate({
        where: { status: "PAID", createdAt: inPeriod },
        _count: true,
        _sum: { amount: true, gstAmount: true },
      }),
      this.prisma.order.aggregate({
        where: { status: "REFUNDED", createdAt: inPeriod },
        _count: true,
        _sum: { amount: true, gstAmount: true },
      }),
      this.prisma.order.groupBy({
        by: ["itemType"],
        where: { status: "PAID", createdAt: inPeriod },
        _count: true,
        _sum: { amount: true, gstAmount: true },
      }),
      // Grouped in SQL, by the day in India: ("createdAt" is stored as UTC
      // without a zone, so it's read as UTC first, then shifted).
      this.prisma.$queryRaw<DailyRow[]>(Prisma.sql`
        SELECT to_char(("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD') AS day,
               count(*) AS orders,
               sum("amount" + "gstAmount") AS gross
        FROM "Order"
        WHERE "status" = 'PAID' AND "createdAt" >= ${since} AND "createdAt" <= ${now}
        GROUP BY 1`),
      this.prisma.generatedDocument.count({ where: { createdAt: inPeriod } }),
      this.prisma.generatedDocument.count({
        where: { createdAt: inPeriod, status: { in: ["PAID", "DOWNLOADED"] } },
      }),
      this.prisma.generatedDocument.groupBy({
        by: ["templateId"],
        where: { createdAt: inPeriod },
        _count: true,
        orderBy: { _count: { templateId: "desc" } },
        take: TOP_N,
      }),
      this.prisma.generatedDocument.groupBy({
        by: ["templateId"],
        where: { createdAt: inPeriod, status: { in: ["PAID", "DOWNLOADED"] } },
        _count: true,
      }),
      this.prisma.order.groupBy({
        by: ["contentLibraryItemId"],
        where: {
          status: "PAID",
          createdAt: inPeriod,
          contentLibraryItemId: { not: null },
        },
        _count: true,
        _sum: { amount: true, gstAmount: true },
        orderBy: { _count: { contentLibraryItemId: "desc" } },
        take: TOP_N,
      }),
      this.prisma.user.count({
        where: { role: "CUSTOMER", createdAt: inPeriod },
      }),
      // Right now, not over the period: it's a to-do count.
      this.prisma.documentReview.count({
        where: { status: { in: ["QUEUED", "IN_REVIEW"] } },
      }),
    ]);

    const [templates, items] = await Promise.all([
      this.prisma.template.findMany({
        where: { id: { in: templateCounts.map((t) => t.templateId) } },
        select: { id: true, title: true },
      }),
      this.prisma.contentLibraryItem.findMany({
        where: {
          id: {
            in: libraryCounts.flatMap((l) =>
              l.contentLibraryItemId ? [l.contentLibraryItemId] : [],
            ),
          },
        },
        select: { id: true, title: true, type: true },
      }),
    ]);

    const gross = (sum: { amount: number | null; gstAmount: number | null }) =>
      (sum.amount ?? 0) + (sum.gstAmount ?? 0);
    const paidGross = gross(paid._sum);
    const byDay = new Map(daily.map((row) => [row.day, row]));
    const paidByTemplate = new Map(
      templatePaidCounts.map((row) => [row.templateId, row._count]),
    );

    return {
      period: { days, from: dayList[0], to: dayList[dayList.length - 1] },
      revenue: {
        grossPaise: paidGross,
        gstPaise: paid._sum.gstAmount ?? 0,
        orders: paid._count,
        averageOrderPaise:
          paid._count > 0 ? Math.round(paidGross / paid._count) : 0,
      },
      refunds: { orders: refunded._count, grossPaise: gross(refunded._sum) },
      byType: byType
        .map((row) => ({
          itemType: row.itemType,
          orders: row._count,
          grossPaise: gross(row._sum),
        }))
        .sort((a, b) => b.grossPaise - a.grossPaise),
      daily: dayList.map((day) => {
        const row = byDay.get(day);
        return {
          day,
          orders: Number(row?.orders ?? 0),
          grossPaise: Number(row?.gross ?? 0),
        };
      }),
      documents: { generated, paid: generatedPaid },
      topTemplates: templateCounts.map((row) => ({
        templateId: row.templateId,
        title:
          templates.find((t) => t.id === row.templateId)?.title ??
          "Deleted template",
        generated: row._count,
        paid: paidByTemplate.get(row.templateId) ?? 0,
      })),
      topLibraryItems: libraryCounts.map((row) => {
        const item = items.find((i) => i.id === row.contentLibraryItemId);
        return {
          id: row.contentLibraryItemId,
          title: item?.title ?? "Deleted item",
          type: item?.type ?? null,
          orders: row._count,
          grossPaise: gross(row._sum),
        };
      }),
      newCustomers,
      reviewsWaiting,
    };
  }
}
