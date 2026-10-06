import { grossPaise } from "@pratikar/utils";

import type { FacetDef } from "./browse";

/** Price bands, on the GST-inclusive price — the number every page shows. */
const BANDS = [
  { value: "under-100", label: "Under ₹100", max: 100 },
  { value: "100-199", label: "₹100 – ₹199", max: 200 },
  { value: "200-499", label: "₹200 – ₹499", max: 500 },
  { value: "500-plus", label: "₹500 and above", max: Infinity },
] as const;

/** The band a list price (before GST, in paise) falls in. */
export const priceBand = (priceInPaise: number): string => {
  const rupees = grossPaise(priceInPaise) / 100;
  // The last band has no ceiling, so every price lands in one.
  return BANDS.find((band) => rupees < band.max)?.value ?? "500-plus";
};

/** A Price facet for any catalogue item with a list price. */
export function priceFacet<T>(priceOf: (item: T) => number): FacetDef<T> {
  return {
    id: "price",
    label: "Price",
    options: BANDS.map(({ value, label }) => ({ value, label })),
    valuesOf: (item) => [priceBand(priceOf(item))],
  };
}
