const RUPEES = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  // Whole rupees print without ".00" — shelf prices are round, and the
  // decimals were the noisiest thing on every card. Anything with paise
  // keeps them.
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/**
 * A storefront price: `249900` -> `"₹2,499"`, with Indian digit grouping
 * (`₹1,00,000`). For display only — invoices and totals use formatPaise from
 * @pratikar/utils, which always shows paise.
 */
export const formatPrice = (paise: number): string =>
  RUPEES.format(paise / 100);
