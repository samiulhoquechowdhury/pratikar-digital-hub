/** "12%" of a whole; "—" when there's nothing to divide. */
export const share = (part: number, whole: number) =>
  whole > 0 ? `${Math.round((part / whole) * 100)}%` : "—";
