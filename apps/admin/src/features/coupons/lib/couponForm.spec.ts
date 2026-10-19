import type { AdminCoupon } from "@pratikar/types";

import { BLANK_FORM, offerOf, stateOf, toForm, toInput } from "./couponForm";

const form = (overrides: Partial<typeof BLANK_FORM>) => ({
  ...BLANK_FORM,
  code: "launch20",
  value: "20",
  ...overrides,
});

describe("toInput", () => {
  it("upper-cases the code and keeps a percentage as a percentage", () => {
    expect(toInput(form({}))).toMatchObject({
      code: "LAUNCH20",
      kind: "PERCENT",
      value: 20,
      maxDiscountInPaise: null,
      maxRedemptions: null,
      perUserLimit: 1,
    });
  });

  it("turns rupees into paise", () => {
    expect(
      toInput(
        form({
          kind: "FLAT",
          value: "49.50",
          minOrder: "199",
          maxRedemptions: "100",
        }),
      ),
    ).toMatchObject({
      value: 4_950,
      minOrderInPaise: 19_900,
      maxRedemptions: 100,
    });
  });

  it("drops a cap on a flat discount", () => {
    expect(
      toInput(form({ kind: "FLAT", value: "50", maxDiscount: "10" })),
    ).toMatchObject({
      maxDiscountInPaise: null,
    });
  });

  it("makes dates whole days in India", () => {
    expect(
      toInput(form({ startsOn: "2026-11-01", endsOn: "2026-11-30" })),
    ).toMatchObject({
      startsAt: "2026-11-01T00:00:00+05:30",
      endsAt: "2026-11-30T23:59:59+05:30",
    });
  });

  it.each([
    [{ code: "ab" }, "The code"],
    [{ value: "120" }, "1 to 100"],
    [{ kind: "FLAT" as const, value: "0.5" }, "₹1 or more"],
    [{ maxRedemptions: "0" }, "Total uses"],
    [{ perUserLimit: "" }, "Uses per customer"],
    [{ startsOn: "2026-12-01", endsOn: "2026-11-01" }, "end date"],
  ])("rejects %j", (overrides, message) => {
    expect(toInput(form(overrides))).toEqual(expect.stringContaining(message));
  });
});

const COUPON: AdminCoupon = {
  id: "c1",
  code: "LAUNCH20",
  description: "Launch",
  kind: "PERCENT",
  value: 20,
  maxDiscountInPaise: 30_000,
  minOrderInPaise: null,
  appliesTo: [],
  startsAt: "2026-10-31T18:30:00.000Z",
  endsAt: null,
  maxRedemptions: 10,
  perUserLimit: 1,
  active: true,
  redemptions: 3,
  discountGivenInPaise: 7_500,
  createdAt: "",
  updatedAt: "",
};

describe("toForm", () => {
  it("shows stored paise and dates as an operator typed them", () => {
    expect(toForm(COUPON)).toMatchObject({
      value: "20",
      maxDiscount: "300",
      startsOn: "2026-11-01",
      maxRedemptions: "10",
    });
  });
});

describe("offerOf", () => {
  it("describes both kinds", () => {
    expect(offerOf(COUPON)).toBe("20% off, up to ₹300");
    expect(
      offerOf({ kind: "FLAT", value: 4_950, maxDiscountInPaise: null }),
    ).toBe("₹49.50 off");
  });
});

describe("stateOf", () => {
  const now = new Date("2026-11-15T00:00:00Z");
  it.each([
    [{}, "Live"],
    [{ active: false }, "Off"],
    [{ startsAt: "2026-12-01T00:00:00Z" }, "Scheduled"],
    [{ endsAt: "2026-11-01T00:00:00Z" }, "Expired"],
    [{ redemptions: 10 }, "Used up"],
  ])("%j is %s", (overrides, state) => {
    expect(stateOf({ ...COUPON, ...overrides }, now)).toBe(state);
  });
});
