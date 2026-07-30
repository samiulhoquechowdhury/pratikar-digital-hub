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
