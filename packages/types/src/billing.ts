/**
 * GST invoicing (docs/srs.md Section 3.5, Section 8 item 4).
 *
 * The amounts are in paise and are a *snapshot* taken when the invoice was
 * raised — they are not recomputed from the order, because an invoice states
 * what was charged on a date rather than what the current rate would be.
 */
export interface OrderInvoice {
  /** Sequential within a financial year, e.g. "PDH/2627/000042". */
  invoiceNumber: string;
  issuedAt: string;

  taxableAmount: number;
  /** Intra-state supply: CGST and SGST are charged, IGST is zero. */
  cgstAmount: number;
  sgstAmount: number;
  /** Inter-state supply: IGST is charged, CGST and SGST are zero. */
  igstAmount: number;
  totalAmount: number;
  /** The combined rate that produced the amounts above, e.g. 18. */
  taxRatePercent: number;
  /** GST state code the supply was made to, e.g. "19". */
  placeOfSupply: string;

  /**
   * True when the deployment has no company GST registration configured. The
   * sale is still recorded and numbered, but the PDF is marked PROFORMA and
   * is not a valid tax invoice — surfaced so the UI can say so rather than
   * offering it as though it were the real thing.
   */
  isProforma: boolean;

  /** Short-lived and signed. Mint it at click time, never store it. */
  downloadUrl: string;
}
