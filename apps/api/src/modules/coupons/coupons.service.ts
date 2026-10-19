import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { OrderItemType } from "@pratikar/types";
import { Prisma, type Coupon } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";
import {
  AuditAction,
  AuditService,
  AuditTargetType,
} from "../audit/audit.service";

import { discountFor, normaliseCode, problemWith } from "./coupon-rules";
import type { UpsertCouponDto } from "./dto/coupon.dto";

/** A coupon that applies to an order, and what it takes off. */
export interface AppliedCoupon {
  coupon: Coupon;
  discountInPaise: number;
}

/**
 * Discount codes: the admin's list, and the check checkout makes.
 *
 * A code counts as used only by a PAID order, so a customer who abandons a
 * checkout hasn't spent their one-time code. The flip side is that two
 * customers could start checkouts on a last remaining use at the same
 * moment; both are let through rather than refusing someone mid-payment —
 * a limit can be exceeded by an order or two, never the other way round.
 */
@Injectable()
export class CouponsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * The coupon and its discount for this order, or an error naming why it
   * doesn't apply — one of the CouponProblem codes.
   */
  async apply(
    code: string,
    userId: string,
    itemType: OrderItemType,
    listInPaise: number,
  ): Promise<AppliedCoupon> {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: normaliseCode(code) },
    });
    if (!coupon) throw new BadRequestException("COUPON_NOT_FOUND");

    const [redeemed, redeemedByUser] = await Promise.all([
      this.prisma.order.count({
        where: { couponId: coupon.id, status: "PAID" },
      }),
      this.prisma.order.count({
        where: { couponId: coupon.id, status: "PAID", userId },
      }),
    ]);
    const problem = problemWith(coupon, {
      itemType,
      listInPaise,
      now: new Date(),
      redeemed,
      redeemedByUser,
    });
    if (problem) throw new BadRequestException(problem);

    return { coupon, discountInPaise: discountFor(coupon, listInPaise) };
  }

  /** Every coupon, newest first, with how often and how much it was used. */
  async list() {
    const [coupons, usage] = await Promise.all([
      this.prisma.coupon.findMany({ orderBy: { createdAt: "desc" } }),
      this.prisma.order.groupBy({
        by: ["couponId"],
        where: { couponId: { not: null }, status: "PAID" },
        _count: { _all: true },
        _sum: { discountAmount: true },
      }),
    ]);
    const byCoupon = new Map(usage.map((row) => [row.couponId, row]));
    return coupons.map((coupon) => ({
      ...coupon,
      redemptions: byCoupon.get(coupon.id)?._count._all ?? 0,
      discountGivenInPaise: byCoupon.get(coupon.id)?._sum.discountAmount ?? 0,
    }));
  }

  async create(dto: UpsertCouponDto, actorUserId: string) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const coupon = await tx.coupon.create({ data: dataOf(dto) });
        await this.audit.recordWith(tx, {
          actorUserId,
          action: AuditAction.COUPON_CREATED,
          targetType: AuditTargetType.COUPON,
          targetId: coupon.id,
          metadata: termsOf(coupon),
        });
        return coupon;
      });
    } catch (error) {
      throw duplicateCodeOr(error);
    }
  }

  async update(id: string, dto: UpsertCouponDto, actorUserId: string) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const existing = await tx.coupon.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException("COUPON_NOT_FOUND");
        const coupon = await tx.coupon.update({
          where: { id },
          data: dataOf(dto),
        });
        await this.audit.recordWith(tx, {
          actorUserId,
          action: AuditAction.COUPON_UPDATED,
          targetType: AuditTargetType.COUPON,
          targetId: id,
          metadata: { from: termsOf(existing), to: termsOf(coupon) },
        });
        return coupon;
      });
    } catch (error) {
      throw duplicateCodeOr(error);
    }
  }
}

function dataOf(dto: UpsertCouponDto) {
  if (dto.kind === "PERCENT" && dto.value > 100) {
    throw new BadRequestException("PERCENT_OVER_100");
  }
  return {
    code: normaliseCode(dto.code),
    description: dto.description?.trim() || null,
    kind: dto.kind,
    value: dto.value,
    // A cap only means something on a percentage.
    maxDiscountInPaise:
      dto.kind === "PERCENT" ? (dto.maxDiscountInPaise ?? null) : null,
    minOrderInPaise: dto.minOrderInPaise ?? null,
    appliesTo: dto.appliesTo,
    startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
    endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
    maxRedemptions: dto.maxRedemptions ?? null,
    perUserLimit: dto.perUserLimit,
    active: dto.active,
  };
}

/** What the audit log keeps of a coupon — the money terms, not the prose. */
function termsOf(coupon: Coupon) {
  return {
    code: coupon.code,
    kind: coupon.kind,
    value: coupon.value,
    maxDiscountInPaise: coupon.maxDiscountInPaise,
    maxRedemptions: coupon.maxRedemptions,
    active: coupon.active,
  };
}

function duplicateCodeOr(error: unknown): unknown {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return new ConflictException("COUPON_CODE_TAKEN");
  }
  return error;
}
