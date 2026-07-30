/**
 * Money is stored and transmitted as integer paise everywhere — never floats,
 * so rounding can't drift on the way to the database. These helpers exist only
 * for display.
 *
 * NOTE: apps/admin has its own rupeesToPaise/paiseToRupees in
 * features/templates/lib/fieldSchema for parsing form input. Those should
 * eventually move here so there's a single money implementation; left in place
 * for now because they're covered by tests that live with that feature.
 */

/** `19900` -> `"199.00"`. */
export const paiseToRupees = (paise: number): string =>
  (paise / 100).toFixed(2);

/** `19900` -> `"₹199.00"`. */
export const formatPaise = (paise: number): string =>
  `₹${paiseToRupees(paise)}`;

/**
 * What the customer actually pays: the item price plus GST. Orders store the
 * two separately, so anywhere showing "the price" has to add them or it
 * understates the charge.
 */
export const formatOrderTotal = (order: {
  amount: number;
  gstAmount: number;
}): string => formatPaise(order.amount + order.gstAmount);

/**
 * Mirrors GST_RATE in apps/api PaymentsService, which is the authority — the
 * amount charged is whatever the server computed when it created the order.
 * This exists so a catalogue page can quote a total before an order exists,
 * and it must stay in step with the server's rate. Like that constant, it's a
 * placeholder until the client's accountant confirms the applicable rate.
 */
export const GST_RATE = 0.18;

/** Estimated charge for an item at `priceInPaise`, GST included. */
export const grossPaise = (priceInPaise: number): number =>
  priceInPaise + Math.round(priceInPaise * GST_RATE);
