import type { CouponKind, CouponProblem, OrderItemType } from "@pratikar/types";

/**
 * The least an order can cost after a discount, in paise. Razorpay can't
 * take a payment below ₹1, and a ₹0 "purchase" would skip the payment,
 * the invoice and everything that hangs off a captured payment — so a
 * coupon can take an order down to ₹1, never to nothing.
 */
export const MIN_PAYABLE_PAISE = 100;

/** The parts of a coupon these rules read. */
export interface CouponTerms {
  kind: CouponKind;
  value: number;
  maxDiscountInPaise: number | null;
  minOrderInPaise: number | null;
  appliesTo: OrderItemType[];
  startsAt: Date | null;
  endsAt: Date | null;
  maxRedemptions: number | null;
  perUserLimit: number;
  active: boolean;
}

/** Codes are stored and compared upper-case, without surrounding spaces. */
export const normaliseCode = (code: string): string =>
  code.trim().toUpperCase();

/**
 * The discount, in paise, a coupon gives on a list price (before GST).
 *
 * Percentages round to the nearest paisa and respect the cap; a flat amount
 * can't exceed the price; and either way the order still costs at least
 * MIN_PAYABLE_PAISE.
 */
export function discountFor(terms: CouponTerms, listInPaise: number): number {
  const raw =
    terms.kind === "PERCENT"
      ? Math.round((listInPaise * terms.value) / 100)
      : terms.value;
  const capped =
    terms.kind === "PERCENT" && terms.maxDiscountInPaise !== null
      ? Math.min(raw, terms.maxDiscountInPaise)
      : raw;
  const ceiling = Math.max(0, listInPaise - MIN_PAYABLE_PAISE);
  return Math.max(0, Math.min(capped, ceiling));
}

/**
 * Why a coupon can't be used on this order — or null when it can.
 *
 * Checked in the order a customer would want to hear about it: a code
 * that's switched off or out of date first, then one that doesn't fit this
 * purchase, then one that has been used up.
 */
export function problemWith(
  terms: CouponTerms,
  context: {
    itemType: OrderItemType;
    listInPaise: number;
    now: Date;
    /** Paid orders that have used this coupon, everyone's. */
    redeemed: number;
    /** …and this customer's. */
    redeemedByUser: number;
  },
): CouponProblem | null {
  if (!terms.active) return "COUPON_INACTIVE";
  if (terms.startsAt && context.now < terms.startsAt)
    return "COUPON_NOT_STARTED";
  if (terms.endsAt && context.now > terms.endsAt) return "COUPON_EXPIRED";
  if (terms.appliesTo.length > 0 && !terms.appliesTo.includes(context.itemType))
    return "COUPON_NOT_APPLICABLE";
  if (
    terms.minOrderInPaise !== null &&
    context.listInPaise < terms.minOrderInPaise
  )
    return "COUPON_MIN_ORDER";
  if (terms.maxRedemptions !== null && context.redeemed >= terms.maxRedemptions)
    return "COUPON_USED_UP";
  if (context.redeemedByUser >= terms.perUserLimit)
    return "COUPON_ALREADY_USED";
  // A coupon that would take nothing off — a flat ₹50 on a ₹1 item — is
  // as good as not applying, and saying so beats a ₹0 "discount".
  if (discountFor(terms, context.listInPaise) === 0)
    return "COUPON_NOT_APPLICABLE";
  return null;
}
