import {
  type CouponTerms,
  discountFor,
  MIN_PAYABLE_PAISE,
  normaliseCode,
  problemWith,
} from "./coupon-rules";

const TERMS: CouponTerms = {
  kind: "PERCENT",
  value: 20,
  maxDiscountInPaise: null,
  minOrderInPaise: null,
  appliesTo: [],
  startsAt: null,
  endsAt: null,
  maxRedemptions: null,
  perUserLimit: 1,
  active: true,
};

const CONTEXT = {
  itemType: "CONTENT_ITEM" as const,
  listInPaise: 12_627,
  now: new Date("2026-10-20T10:00:00Z"),
  redeemed: 0,
  redeemedByUser: 0,
};

describe("normaliseCode", () => {
  it("upper-cases and trims", () => {
    expect(normaliseCode("  launch20 ")).toBe("LAUNCH20");
  });
});

describe("discountFor", () => {
  it("takes a percentage, rounded to the paisa", () => {
    expect(discountFor(TERMS, 12_627)).toBe(2_525);
  });

  it("respects a cap on a percentage", () => {
    expect(
      discountFor({ ...TERMS, value: 50, maxDiscountInPaise: 3_000 }, 12_627),
    ).toBe(3_000);
  });

  it("takes a flat amount", () => {
    expect(discountFor({ ...TERMS, kind: "FLAT", value: 5_000 }, 12_627)).toBe(
      5_000,
    );
  });

  it("always leaves at least ₹1 to pay", () => {
    expect(discountFor({ ...TERMS, value: 100 }, 12_627)).toBe(
      12_627 - MIN_PAYABLE_PAISE,
    );
    expect(discountFor({ ...TERMS, kind: "FLAT", value: 99_999 }, 12_627)).toBe(
      12_627 - MIN_PAYABLE_PAISE,
    );
  });

  it("gives nothing on an order that's already ₹1", () => {
    expect(discountFor(TERMS, MIN_PAYABLE_PAISE)).toBe(0);
  });
});

describe("problemWith", () => {
  it("accepts a valid coupon", () => {
    expect(problemWith(TERMS, CONTEXT)).toBeNull();
  });

  it.each([
    [{ active: false }, {}, "COUPON_INACTIVE"],
    [{ startsAt: new Date("2026-11-01") }, {}, "COUPON_NOT_STARTED"],
    [{ endsAt: new Date("2026-10-01") }, {}, "COUPON_EXPIRED"],
    [{ appliesTo: ["COURSE" as const] }, {}, "COUPON_NOT_APPLICABLE"],
    [{ minOrderInPaise: 50_000 }, {}, "COUPON_MIN_ORDER"],
    [{ maxRedemptions: 10 }, { redeemed: 10 }, "COUPON_USED_UP"],
    [{}, { redeemedByUser: 1 }, "COUPON_ALREADY_USED"],
    [
      { kind: "FLAT" as const, value: 500 },
      { listInPaise: 100 },
      "COUPON_NOT_APPLICABLE",
    ],
  ])("rejects %j with %j as %s", (terms, context, problem) => {
    expect(
      problemWith({ ...TERMS, ...terms }, { ...CONTEXT, ...context }),
    ).toBe(problem);
  });

  it("allows a coupon on the kinds it lists", () => {
    expect(
      problemWith({ ...TERMS, appliesTo: ["CONTENT_ITEM"] }, CONTEXT),
    ).toBeNull();
  });

  it("allows several uses per customer when the limit says so", () => {
    expect(
      problemWith(
        { ...TERMS, perUserLimit: 3 },
        { ...CONTEXT, redeemedByUser: 2 },
      ),
    ).toBeNull();
  });
});
