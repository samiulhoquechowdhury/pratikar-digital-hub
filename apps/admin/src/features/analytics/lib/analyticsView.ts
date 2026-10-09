/**
 * The dashboard's arithmetic, kept pure so it can be tested without a
 * browser: where a percentage could divide by zero, a bar could vanish, or an
 * axis could print thirty labels on top of each other.
 */

/** Share of generated documents that were paid for, or null with none made. */
export function conversionPercent(documents: {
  generated: number;
  paid: number;
}): number | null {
  return documents.generated > 0
    ? Math.round((documents.paid / documents.generated) * 100)
    : null;
}

/** A part as a percentage of the whole, 0 when the whole is 0. */
export const shareOf = (part: number, whole: number): number =>
  whole > 0 ? (part / whole) * 100 : 0;

/**
 * A bar's height as a percentage of the tallest. A day with sales never
 * draws thinner than 2% — a sliver would read as nothing — and a day without
 * sales draws nothing at all.
 */
export const barHeightPercent = (value: number, max: number): number =>
  value > 0 && max > 0 ? Math.max((value / max) * 100, 2) : 0;

/** Label every nth day along the axis: about seven labels, whatever the period. */
export const axisLabelStep = (days: number): number =>
  Math.max(1, Math.ceil(days / 7));
