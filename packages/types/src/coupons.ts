import type { OrderItemType } from "./catalogue";

export type CouponKind = "PERCENT" | "FLAT";

/**
 * Why a code didn't apply. The checkout says each of these in plain words;
 * the admin sees the same reasons when testing a code.
 */
export type CouponProblem =
  | "COUPON_NOT_FOUND"
  | "COUPON_INACTIVE"
  | "COUPON_NOT_STARTED"
  | "COUPON_EXPIRED"
  | "COUPON_NOT_APPLICABLE"
  | "COUPON_MIN_ORDER"
  | "COUPON_USED_UP"
  | "COUPON_ALREADY_USED";

/** A coupon's terms, as the admin edits them. Money is paise. */
export interface CouponInput {
  code: string;
  description?: string | null;
  kind: CouponKind;
  /** Percent (1–100) for PERCENT; paise for FLAT. */
  value: number;
  maxDiscountInPaise?: number | null;
  minOrderInPaise?: number | null;
  /** Empty for every kind of purchase. */
  appliesTo: OrderItemType[];
  startsAt?: string | null;
  endsAt?: string | null;
  maxRedemptions?: number | null;
  perUserLimit: number;
  active: boolean;
}

/** A coupon in the admin list, with how often it has been used. */
export interface AdminCoupon extends CouponInput {
  id: string;
  /** Paid orders that used it. */
  redemptions: number;
  /** Total discount given on those orders, paise. */
  discountGivenInPaise: number;
  createdAt: string;
  updatedAt: string;
}

/** What checkout shows once a code applies. All paise. */
export interface CouponQuote {
  code: string;
  description: string | null;
  listInPaise: number;
  discountInPaise: number;
  /** After the discount, before GST. */
  amountInPaise: number;
  gstInPaise: number;
  totalInPaise: number;
}
