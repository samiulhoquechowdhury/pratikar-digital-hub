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
