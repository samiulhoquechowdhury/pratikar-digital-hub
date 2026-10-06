import { priceBand } from "./priceFacet";

describe("priceBand", () => {
  // Bands use the price the customer sees: list price plus 18% GST.
  it.each([
    [8_390, "under-100"], // ₹99 incl. GST
    [12_627, "100-199"], // ₹149
    [25_339, "200-499"], // ₹299
    [42_300, "200-499"], // ₹499.14 rounds into the next band only past ₹500
    [249_900, "500-plus"], // ₹2,948.82
  ])("%i paise → %s", (paise, band) => {
    expect(priceBand(paise)).toBe(band);
  });
});
