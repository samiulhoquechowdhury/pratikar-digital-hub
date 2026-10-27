import { formatPrice } from "./format";

describe("formatPrice", () => {
  it("prints whole rupees without decimals", () => {
    expect(formatPrice(14_900)).toBe("₹149");
    expect(formatPrice(10_000_000)).toBe("₹1,00,000");
  });

  it("prints both paise digits when there are paise", () => {
    expect(formatPrice(11_920)).toBe("₹119.20");
    expect(formatPrice(23_482)).toBe("₹234.82");
  });
});
