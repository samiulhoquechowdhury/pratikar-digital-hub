import type {
  AdminCoupon,
  CouponInput,
  CouponKind,
  OrderItemType,
} from "@pratikar/types";

import { rupeesToPaise } from "@/features/content-library/lib/importSelection";

/**
 * The coupon form's maths: what an operator types (rupees, dates, blank
 * for "no limit") to what the API stores (paise, ISO dates, null), and
 * back. Pure, so the money conversions are tested rather than trusted.
 */

export interface CouponForm {
  code: string;
  description: string;
  kind: CouponKind;
  /** Percent for PERCENT, rupees for FLAT. */
  value: string;
  maxDiscount: string;
  minOrder: string;
  appliesTo: OrderItemType[];
  /** yyyy-mm-dd, or blank. */
  startsOn: string;
  endsOn: string;
  maxRedemptions: string;
  perUserLimit: string;
  active: boolean;
}

export const BLANK_FORM: CouponForm = {
  code: "",
  description: "",
  kind: "PERCENT",
  value: "",
  maxDiscount: "",
  minOrder: "",
  appliesTo: [],
  startsOn: "",
  endsOn: "",
  maxRedemptions: "",
  perUserLimit: "1",
  active: true,
};

export const ITEM_TYPE_LABELS: Record<OrderItemType, string> = {
  DOCUMENT: "Template documents",
  DOCUMENT_REVIEW: "Advocate reviews",
  CONTENT_ITEM: "Library items",
  COURSE: "Courses",
};

const paiseToRupees = (paise: number | null | undefined) =>
  paise == null ? "" : (paise / 100).toFixed(paise % 100 === 0 ? 0 : 2);

/** Rupees as typed — blank means "none". Returns undefined when invalid. */
function optionalPaise(text: string): number | null | undefined {
  if (!text.trim()) return null;
  return rupeesToPaise(text) ?? undefined;
}

function optionalCount(text: string): number | null | undefined {
  if (!text.trim()) return null;
  return /^\d+$/.test(text.trim()) ? Number(text.trim()) : undefined;
}

/**
 * The form as the API wants it, or a sentence saying what to fix.
 *
 * Dates are whole days in India: a coupon "ending 31 Oct" works until the
 * end of 31 October IST, not midnight UTC the night before.
 */
export function toInput(form: CouponForm): CouponInput | string {
  const code = form.code.trim().toUpperCase();
  if (!/^[A-Z0-9_-]{3,32}$/.test(code))
    return "The code needs 3–32 letters, digits, - or _.";

  let value: number;
  if (form.kind === "PERCENT") {
    if (!/^\d+$/.test(form.value.trim())) return "Enter the percentage off.";
    value = Number(form.value.trim());
    if (value < 1 || value > 100) return "A percentage is 1 to 100.";
  } else {
    const paise = rupeesToPaise(form.value);
    if (paise === null || paise < 100)
      return "Enter the rupees off (₹1 or more).";
    value = paise;
  }

  const maxDiscountInPaise =
    form.kind === "PERCENT" ? optionalPaise(form.maxDiscount) : null;
  if (maxDiscountInPaise === undefined)
    return "The maximum discount isn't a valid amount.";
  if (maxDiscountInPaise !== null && maxDiscountInPaise < 100)
    return "A maximum discount must be ₹1 or more.";

  const minOrderInPaise = optionalPaise(form.minOrder);
  if (minOrderInPaise === undefined)
    return "The minimum order isn't a valid amount.";

  const maxRedemptions = optionalCount(form.maxRedemptions);
  if (maxRedemptions === undefined || maxRedemptions === 0)
    return "Total uses must be a whole number, or blank for no limit.";

  const perUserLimit = optionalCount(form.perUserLimit);
  if (!perUserLimit || perUserLimit > 100)
    return "Uses per customer must be 1 to 100.";

  const startsAt = form.startsOn ? `${form.startsOn}T00:00:00+05:30` : null;
  const endsAt = form.endsOn ? `${form.endsOn}T23:59:59+05:30` : null;
  if (startsAt && endsAt && new Date(endsAt) < new Date(startsAt))
    return "The end date is before the start date.";

  return {
    code,
    description: form.description.trim() || null,
    kind: form.kind,
    value,
    maxDiscountInPaise,
    minOrderInPaise,
    appliesTo: form.appliesTo,
    startsAt,
    endsAt,
    maxRedemptions,
    perUserLimit,
    active: form.active,
  };
}

/** The date part of an ISO date, as seen in India. */
const istDay = (iso: string | null | undefined) =>
  iso
    ? new Date(new Date(iso).getTime() + 5.5 * 3600_000)
        .toISOString()
        .slice(0, 10)
    : "";

export function toForm(coupon: AdminCoupon): CouponForm {
  return {
    code: coupon.code,
    description: coupon.description ?? "",
    kind: coupon.kind,
    value:
      coupon.kind === "PERCENT"
        ? String(coupon.value)
        : paiseToRupees(coupon.value),
    maxDiscount: paiseToRupees(coupon.maxDiscountInPaise),
    minOrder: paiseToRupees(coupon.minOrderInPaise),
    appliesTo: coupon.appliesTo,
    startsOn: istDay(coupon.startsAt),
    endsOn: istDay(coupon.endsAt),
    maxRedemptions:
      coupon.maxRedemptions == null ? "" : String(coupon.maxRedemptions),
    perUserLimit: String(coupon.perUserLimit),
    active: coupon.active,
  };
}

/** "20% off, up to ₹300" / "₹50 off". */
export function offerOf(
  coupon: Pick<AdminCoupon, "kind" | "value" | "maxDiscountInPaise">,
): string {
  if (coupon.kind === "FLAT") return `₹${paiseToRupees(coupon.value)} off`;
  return coupon.maxDiscountInPaise == null
    ? `${coupon.value}% off`
    : `${coupon.value}% off, up to ₹${paiseToRupees(coupon.maxDiscountInPaise)}`;
}

/** Live, scheduled, expired, used up or switched off — as of now. */
export function stateOf(
  coupon: Pick<
    AdminCoupon,
    "active" | "startsAt" | "endsAt" | "maxRedemptions" | "redemptions"
  >,
  now = new Date(),
): "Live" | "Scheduled" | "Expired" | "Used up" | "Off" {
  if (!coupon.active) return "Off";
  if (coupon.endsAt && new Date(coupon.endsAt) < now) return "Expired";
  if (coupon.startsAt && new Date(coupon.startsAt) > now) return "Scheduled";
  if (
    coupon.maxRedemptions != null &&
    coupon.redemptions >= coupon.maxRedemptions
  )
    return "Used up";
  return "Live";
}
