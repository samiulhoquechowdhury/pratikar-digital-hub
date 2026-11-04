// Mirrors apps/web/src/shared/lib/format.ts, so a price reads the same in
// the app as on the website.
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

/** `249900` -> `"₹2,499"`; anything with paise shows both digits. */
export const formatPrice = (paise: number): string =>
  (Math.round(paise) % 100 === 0 ? WHOLE_RUPEES : RUPEES_AND_PAISE).format(
    paise / 100,
  );

const DATE = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export const formatDate = (iso: string): string => DATE.format(new Date(iso));
