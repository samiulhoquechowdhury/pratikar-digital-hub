import { Prisma } from "@prisma/client";

import { financialYearOf, formatInvoiceNumber } from "./gst";

export interface AllocatedNumber {
  invoiceNumber: string;
  financialYear: string;
  sequence: number;
}

/**
 * Takes the next serial for the financial year the invoice falls in.
 *
 * ── WHY THIS IS RAW SQL ────────────────────────────────────────────────────
 * GST requires a *consecutive* series, which makes allocation a concurrency
 * problem rather than a formatting one. Two obvious implementations are both
 * wrong under load:
 *
 *   count(*) + 1          two webhooks arriving together both see the same
 *                         count and mint the same number
 *   read, then update     the classic lost update — same outcome, wider window
 *
 * `INSERT … ON CONFLICT DO UPDATE … RETURNING` does the read, the increment
 * and the write in one statement, so Postgres holds a row lock for its
 * duration and the second caller waits and gets the next value. Razorpay
 * retries webhooks aggressively and delivers concurrently, so this is a live
 * concern, not a theoretical one.
 *
 * Must be called inside the same transaction that writes the Invoice: if that
 * transaction rolls back, the counter rolls back with it and the series has no
 * gap. A gap is not merely untidy — it is the thing an auditor asks about.
 */
export async function allocateInvoiceNumber(
  tx: Prisma.TransactionClient,
  prefix: string,
  issuedAt: Date,
): Promise<AllocatedNumber> {
  const financialYear = financialYearOf(issuedAt);

  const rows = await tx.$queryRaw<{ lastSequence: number }[]>`
    INSERT INTO "InvoiceCounter" ("financialYear", "lastSequence", "updatedAt")
    VALUES (${financialYear}, 1, NOW())
    ON CONFLICT ("financialYear")
    DO UPDATE SET "lastSequence" = "InvoiceCounter"."lastSequence" + 1,
                  "updatedAt"    = NOW()
    RETURNING "lastSequence"
  `;

  const sequence = rows[0]?.lastSequence;
  if (sequence === undefined) {
    // Unreachable: the statement always returns the row it wrote. Checked
    // anyway because the alternative is a NaN in an invoice number.
    throw new Error("Invoice counter returned no row");
  }

  return {
    invoiceNumber: formatInvoiceNumber(prefix, financialYear, sequence),
    financialYear,
    sequence,
  };
}
