import type { TemplateField } from "@pratikar/types";

import {
  answersFromPrevious,
  fitToField,
  prefillFromProfile,
  type CustomerProfile,
} from "./prefill";

const PROFILE: CustomerProfile = {
  name: "Asha Rao",
  email: "asha@example.com",
  phone: null,
  addressLine: "12 Park Street",
  city: "Kolkata",
  stateCode: "19",
  pincode: "700016",
};

const field = (overrides: Partial<TemplateField>): TemplateField => ({
  key: "k",
  label: "K",
  type: "text",
  required: false,
  ...overrides,
});

describe("prefillFromProfile", () => {
  it("fills only the fields marked as the customer's own", () => {
    const fields = [
      field({ key: "tenantName", profileField: "name" }),
      field({ key: "landlordName" }),
      field({
        key: "tenantAddress",
        type: "textarea",
        profileField: "address",
      }),
      field({ key: "state", profileField: "state" }),
      field({ key: "pin", type: "number", profileField: "pincode" }),
    ];

    expect(prefillFromProfile(fields, PROFILE)).toEqual({
      tenantName: "Asha Rao",
      tenantAddress: "12 Park Street",
      state: "West Bengal",
      pin: 700016,
    });
  });

  it("skips what the profile doesn't have", () => {
    expect(
      prefillFromProfile([field({ key: "p", profileField: "phone" })], PROFILE),
    ).toEqual({});
  });

  it("fills a state dropdown only with one of its own options", () => {
    const states = field({
      key: "state",
      type: "select",
      profileField: "state",
      options: [
        { value: "WB", label: "West Bengal" },
        { value: "MH", label: "Maharashtra" },
      ],
    });
    expect(prefillFromProfile([states], PROFILE)).toEqual({ state: "WB" });
    expect(
      prefillFromProfile([states], { ...PROFILE, stateCode: "29" }),
    ).toEqual({});
  });
});

describe("answersFromPrevious", () => {
  it("carries answers into the template as it is now", () => {
    const fields = [
      field({ key: "tenant" }),
      field({ key: "rent", type: "number" }),
      field({
        key: "furnished",
        type: "select",
        options: [{ value: "yes", label: "Furnished" }],
      }),
    ];
    expect(
      answersFromPrevious(fields, {
        tenant: "Asha",
        rent: 18000,
        furnished: "semi", // an option since removed
        removedField: "x",
      }),
    ).toEqual({ tenant: "Asha", rent: 18000 });
  });
});

describe("fitToField", () => {
  it.each([
    [field({ type: "number" }), "18,000", 18000],
    [field({ type: "number" }), "lots", undefined],
    [field({ type: "date" }), "2026-11-01", "2026-11-01"],
    [field({ type: "date" }), "1 Nov", undefined],
    [field({ type: "text" }), "  ", undefined],
  ])("fits %#", (f, raw, expected) => {
    expect(fitToField(f, raw)).toBe(expected);
  });
});
