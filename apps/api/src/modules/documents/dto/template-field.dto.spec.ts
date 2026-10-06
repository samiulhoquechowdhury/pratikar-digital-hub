import "reflect-metadata";

import { plainToInstance } from "class-transformer";
import { validateSync } from "class-validator";

import { TemplateFieldDto } from "./template-field.dto";

const check = (body: Record<string, unknown>) =>
  validateSync(
    plainToInstance(TemplateFieldDto, {
      key: "tenantName",
      label: "Tenant's name",
      type: "text",
      required: true,
      ...body,
    }),
  );

describe("TemplateFieldDto.profileField", () => {
  it("is optional", () => {
    expect(check({})).toHaveLength(0);
  });

  it.each(["name", "address", "state", "pincode"])("accepts %s", (value) => {
    expect(check({ profileField: value })).toHaveLength(0);
  });

  // Anything else would reach the website as a field it can't fill.
  it.each(["landlordName", "password", ""])("refuses %p", (value) => {
    expect(check({ profileField: value }).length).toBeGreaterThan(0);
  });
});
