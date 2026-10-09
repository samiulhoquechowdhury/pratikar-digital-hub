import {
  axisLabelStep,
  barHeightPercent,
  conversionPercent,
  shareOf,
} from "./analyticsView";

describe("conversionPercent", () => {
  it("rounds the share of documents paid for", () => {
    expect(conversionPercent({ generated: 3, paid: 1 })).toBe(33);
  });

  it("has nothing to say when nothing was generated", () => {
    expect(conversionPercent({ generated: 0, paid: 0 })).toBeNull();
  });
});

describe("shareOf", () => {
  it("is a percentage, and 0 of nothing is 0", () => {
    expect(shareOf(25, 100)).toBe(25);
    expect(shareOf(5, 0)).toBe(0);
  });
});

describe("barHeightPercent", () => {
  it("scales against the tallest day", () => {
    expect(barHeightPercent(50, 200)).toBe(25);
    expect(barHeightPercent(200, 200)).toBe(100);
  });

  // A ₹99 day beside a ₹50,000 day must still show up.
  it("never draws a day with sales thinner than a visible sliver", () => {
    expect(barHeightPercent(1, 100_000)).toBe(2);
  });

  it("draws nothing for a day without sales", () => {
    expect(barHeightPercent(0, 100)).toBe(0);
    expect(barHeightPercent(0, 0)).toBe(0);
  });
});

describe("axisLabelStep", () => {
  it.each([
    [7, 1],
    [30, 5],
    [90, 13],
    [365, 53],
  ])("labels about seven of %i days (every %i)", (days, step) => {
    expect(axisLabelStep(days)).toBe(step);
    expect(Math.ceil(days / step)).toBeLessThanOrEqual(7);
  });
});
