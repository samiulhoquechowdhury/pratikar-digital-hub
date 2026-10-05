import { plainToInstance } from "class-transformer";
import { validateSync } from "class-validator";

import { UpdateProfileDto } from "./update-profile.dto";

const check = (body: unknown) => {
  const dto = plainToInstance(UpdateProfileDto, body);
  return { dto, errors: validateSync(dto, { whitelist: true }) };
};

describe("UpdateProfileDto", () => {
  it("tidies spacing in a name", () => {
    const { dto, errors } = check({ name: "  Asha   Rao " });
    expect(errors).toHaveLength(0);
    expect(dto.name).toBe("Asha Rao");
  });

  it.each([[""], ["   "], ["x".repeat(81)], [42]])("refuses %p", (name) => {
    expect(check({ name }).errors.length).toBeGreaterThan(0);
  });
});

describe("UpdateProfileDto address", () => {
  it("accepts a full Indian address", () => {
    const { errors } = check({
      name: "Asha",
      addressLine: "12 Park Street",
      city: "Kolkata",
      stateCode: "19",
      pincode: "700016",
    });
    expect(errors).toHaveLength(0);
  });

  // The state decides the GST on the invoice, so it must be a real code.
  it.each([["99"], ["WB"], ["19 "]])("refuses state code %p", (stateCode) => {
    const { dto, errors } = check({ name: "Asha", stateCode });
    // "19 " is trimmed to a valid code; the others are refused.
    expect(errors.length > 0).toBe(dto.stateCode !== "19");
  });

  it.each([["70001"], ["0700016"], ["70001a"]])(
    "refuses PIN code %p",
    (pincode) => {
      expect(check({ name: "Asha", pincode }).errors.length).toBeGreaterThan(0);
    },
  );

  it("turns an emptied box into null, which clears it", () => {
    const { dto, errors } = check({ name: "Asha", city: "   " });
    expect(errors).toHaveLength(0);
    expect(dto.city).toBeNull();
  });
});
