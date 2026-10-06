import { msg91Number } from "./sms.service";

describe("msg91Number", () => {
  it("adds India's code to a ten-digit number and strips formatting", () => {
    expect(msg91Number("98765 43210")).toBe("919876543210");
    expect(msg91Number("+91 98765-43210")).toBe("919876543210");
  });
});
