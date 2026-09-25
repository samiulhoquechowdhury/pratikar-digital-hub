/**
 * The GST rules an invoice has to satisfy, as pure functions.
 *
 * Kept free of Nest and Prisma on purpose: every rule in here is one an
 * accountant could challenge, and they are far easier to argue about — and to
 * test exhaustively — as plain input/output than buried in a service that
 * needs a database to run.
 *
 * References are to the CGST Rules 2017 and the IGST Act 2017.
 */

/** Two-letter-ish GST state codes, as printed on an invoice. */
export const STATE_NAMES: Readonly<Record<string, string>> = {
  "01": "Jammu and Kashmir",
  "02": "Himachal Pradesh",
  "03": "Punjab",
  "04": "Chandigarh",
  "05": "Uttarakhand",
  "06": "Haryana",
  "07": "Delhi",
  "08": "Rajasthan",
  "09": "Uttar Pradesh",
  "10": "Bihar",
  "11": "Sikkim",
  "12": "Arunachal Pradesh",
  "13": "Nagaland",
  "14": "Manipur",
  "15": "Mizoram",
  "16": "Tripura",
  "17": "Meghalaya",
  "18": "Assam",
  "19": "West Bengal",
  "20": "Jharkhand",
  "21": "Odisha",
  "22": "Chhattisgarh",
  "23": "Madhya Pradesh",
  "24": "Gujarat",
  "26": "Dadra and Nagar Haveli and Daman and Diu",
  "27": "Maharashtra",
  "29": "Karnataka",
  "30": "Goa",
  "31": "Lakshadweep",
  "32": "Kerala",
  "33": "Tamil Nadu",
  "34": "Puducherry",
  "35": "Andaman and Nicobar Islands",
  "36": "Telangana",
  "37": "Andhra Pradesh",
  "38": "Ladakh",
  "97": "Other Territory",
};

export const stateName = (code: string): string =>
  STATE_NAMES[code] ?? "Unknown state";

/**
 * India observes no daylight saving, so a fixed offset is exact — and simpler
 * than going through Intl for two integers.
 */
const IST_OFFSET_MS = (5 * 60 + 30) * 60_000;

/**
 * The Indian financial year runs 1 April – 31 March, so January to March
 * belongs to the year that started the previous April. Returned as "2026-27"
 * because that is how it is written on an invoice.
 *
 * ── WHY THIS IS COMPUTED IN IST, NOT IN LOCAL TIME ────────────────────────
 * It used to call getFullYear() and getMonth(), which read the *server's*
 * timezone. That is right on a machine set to IST and wrong everywhere else:
 * on a UTC server — which is what this deploys to — 1 April 00:30 IST is
 * still 31 March, so an invoice raised in the first five and a half hours of
 * a financial year was numbered into the previous year's series, after that
 * series had closed. A serial issued into a closed year is the kind of thing
 * a GST audit asks about, and nothing in the running system would have
 * flagged it.
 *
 * The financial year is a fact about India, not about where the server runs,
 * so the boundary is evaluated in IST regardless of the host clock.
 */
export function financialYearOf(date: Date): string {
  const ist = new Date(date.getTime() + IST_OFFSET_MS);
  const year = ist.getUTCFullYear();
  const startYear = ist.getUTCMonth() >= 3 ? year : year - 1;
  const endShort = String((startYear + 1) % 100).padStart(2, "0");
  return `${startYear}-${endShort}`;
}

/**
 * Rule 46(b) caps the serial at **sixteen characters** and allows only
 * alphanumerics, "-" and "/". That cap is why the financial year is squeezed
 * to four digits here rather than printed as "2026-27": `PDH/2026-27/000001`
 * is eighteen characters and would not be a valid invoice number.
 *
 *   PDH/2627/000001   ← 15 characters
 */
export function formatInvoiceNumber(
  prefix: string,
  financialYear: string,
  sequence: number,
): string {
  const [start, end] = financialYear.split("-");
  const compactYear = `${String(start).slice(-2)}${end ?? ""}`;
  const number = `${prefix}/${compactYear}/${String(sequence).padStart(6, "0")}`;

  if (number.length > 16) {
    // Better to refuse than to issue a number that fails a compliance check
    // months later, once it is on documents already sent to customers.
    throw new Error(
      `Invoice number "${number}" is ${number.length} characters; Rule 46(b) allows 16. Shorten INVOICE_NUMBER_PREFIX.`,
    );
  }
  if (!/^[A-Za-z0-9/-]+$/.test(number)) {
    throw new Error(
      `Invoice number "${number}" contains characters Rule 46(b) does not allow (only letters, digits, "-" and "/").`,
    );
  }
  return number;
}

export interface TaxSplit {
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
}

/**
 * Splits the tax into the heads that actually appear on the invoice.
 *
 * Same total either way — but the split is not cosmetic. It decides which
 * government gets the money, and an inter-state supply billed as CGST+SGST is
 * wrong in a way that has to be corrected rather than ignored.
 *
 * The halving uses floor for CGST and the remainder for SGST so the two always
 * add back to exactly the tax charged. Splitting an odd number of paise evenly
 * is impossible, and a rounding rule that loses a paisa would make the invoice
 * disagree with the payment.
 */
export function splitTax(
  taxAmount: number,
  placeOfSupply: string,
  sellerStateCode: string,
): TaxSplit {
  const intraState = placeOfSupply === sellerStateCode;
  if (!intraState) {
    return { cgstAmount: 0, sgstAmount: 0, igstAmount: taxAmount };
  }
  const cgstAmount = Math.floor(taxAmount / 2);
  return {
    cgstAmount,
    sgstAmount: taxAmount - cgstAmount,
    igstAmount: 0,
  };
}

/**
 * Where the supply is treated as having been made.
 *
 * For an unregistered buyer, IGST Act s12(2)(b) says it is the buyer's address
 * *on record* — and where there is no address on record, the supplier's own
 * location. We collect no address today, so that fallback is the live path,
 * and it makes every sale intra-state. That is the statutory answer rather
 * than a convenient one, but it stops being right the moment addresses start
 * being collected, which is why the resolved value is stored on the invoice
 * instead of being recomputed on read.
 */
export function resolvePlaceOfSupply(
  buyerStateCode: string | null | undefined,
  sellerStateCode: string,
): string {
  return buyerStateCode && buyerStateCode.trim() !== ""
    ? buyerStateCode.trim()
    : sellerStateCode;
}

/** Paise to the rupee string an invoice prints, e.g. 123456 → "1,234.56". */
export function formatRupees(paise: number): string {
  const negative = paise < 0;
  const absolute = Math.abs(paise);
  const rupees = Math.floor(absolute / 100);
  const remainder = String(absolute % 100).padStart(2, "0");
  // Indian digit grouping: last three digits, then pairs (12,34,567).
  const [head = "", ...tail] = splitIndianGroups(String(rupees));
  const grouped = tail.length > 0 ? `${head},${tail.join(",")}` : head;
  return `${negative ? "-" : ""}${grouped}.${remainder}`;
}

function splitIndianGroups(digits: string): string[] {
  if (digits.length <= 3) return [digits];
  const last3 = digits.slice(-3);
  const rest = digits.slice(0, -3);
  const groups: string[] = [];
  for (let i = rest.length; i > 0; i -= 2) {
    groups.unshift(rest.slice(Math.max(0, i - 2), i));
  }
  return [...groups, last3];
}
