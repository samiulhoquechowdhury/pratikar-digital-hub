import { share } from "./share";

describe("share", () => {
  it("rounds to a whole percentage", () => {
    expect(share(1, 3)).toBe("33%");
    expect(share(5, 40)).toBe("13%");
  });

  it("shows a dash rather than dividing by zero", () => {
    expect(share(0, 0)).toBe("—");
  });
});
