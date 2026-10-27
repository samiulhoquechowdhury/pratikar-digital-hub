// Whole rupees print without ".00" — shelf prices are round, and the
// decimals were the noisiest thing on every card. Anything with paise shows
// both digits: "₹119.20", never "₹119.2".
const WHOLE_RUPEES = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});
const RUPEES_AND_PAISE = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * A storefront price: `249900` -> `"₹2,499"`, with Indian digit grouping
 * (`₹1,00,000`). For display only — invoices and totals use formatPaise from
 * @pratikar/utils, which always shows paise.
 */
export const formatPrice = (paise: number): string =>
  (Math.round(paise) % 100 === 0 ? WHOLE_RUPEES : RUPEES_AND_PAISE).format(
    paise / 100,
  );
