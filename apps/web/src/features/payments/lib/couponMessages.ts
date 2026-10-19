import type { CouponProblem } from "@pratikar/types";

/** What a customer reads when a code doesn't apply. */
const MESSAGES: Record<CouponProblem, string> = {
  COUPON_NOT_FOUND: "That code isn't valid. Check the spelling and try again.",
  COUPON_INACTIVE: "That code isn't active any more.",
  COUPON_NOT_STARTED: "That code can't be used yet.",
  COUPON_EXPIRED: "That code has expired.",
  COUPON_NOT_APPLICABLE: "That code can't be used on this item.",
  COUPON_MIN_ORDER: "This item is below the minimum order for that code.",
  COUPON_USED_UP: "That code has been fully used.",
  COUPON_ALREADY_USED: "You've already used that code.",
};

/**
 * The coupon problem an API error names, if any. The API answers a bad code
 * with a 400 whose message is one of the CouponProblem codes.
 */
export function couponProblemIn(error: unknown): CouponProblem | null {
  const text = error instanceof Error ? error.message : String(error);
  const match = /COUPON_[A-Z_]+/.exec(text)?.[0];
  return match && match in MESSAGES ? (match as CouponProblem) : null;
}

export function couponMessage(error: unknown): string {
  const problem = couponProblemIn(error);
  return problem
    ? MESSAGES[problem]
    : "Couldn't check that code just now. Please try again.";
}
