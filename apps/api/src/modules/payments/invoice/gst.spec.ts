import {
  financialYearOf,
  formatInvoiceNumber,
  formatRupees,
  resolvePlaceOfSupply,
  splitTax,
} from "./gst";

/**
 * These are the rules an accountant would check, so they are tested as rules
 * rather than through the service. Every expectation here corresponds to
 * something in the CGST Rules or the IGST Act, not to a preference.
 */

describe("financialYearOf", () => {
  it.each([
    {
      label: "1 April starts a new year",
      date: "2026-04-01",
      expected: "2026-27",
    },
    { label: "mid-year", date: "2026-08-01", expected: "2026-27" },
    { label: "31 December", date: "2026-12-31", expected: "2026-27" },
    // The trap: January to March belongs to the year that began the previous
    // April. Getting this wrong resets the serial three months early and
    // duplicates numbers against the year that is still open.
    {
      label: "1 January stays in the old year",
      date: "2027-01-01",
      expected: "2026-27",
    },
    {
      label: "31 March is the last day",
      date: "2027-03-31",
      expected: "2026-27",
    },
    { label: "1 April rolls over", date: "2027-04-01", expected: "2027-28" },
  ])("$label → $expected", ({ date, expected }) => {
    expect(financialYearOf(new Date(`${date}T00:00:00+05:30`))).toBe(expected);
  });

  /**
   * The boundary is a fact about India, not about the host clock.
   *
   * This is the assertion that was missing. The original implementation read
   * getFullYear()/getMonth(), so it passed on a developer machine set to IST
   * and failed in CI — and would have mis-numbered real invoices on a UTC
   * server for the first five and a half hours of every financial year.
   *
   * There is no timezone-switching here on purpose: Node reads TZ once at
   * startup, so setting process.env.TZ mid-test changes nothing and would
   * only look like coverage. The real coverage is that these two instants sit
   * on opposite sides of the boundary in IST but the *same* side of it in
   * UTC — so a local-time implementation fails them on any non-IST host,
   * which is exactly what CI is.
   */
  it("uses the IST boundary regardless of where the server runs", () => {
    // 1 April 00:30 IST — still 31 March in UTC.
    expect(financialYearOf(new Date("2026-04-01T00:30:00+05:30"))).toBe(
      "2026-27",
    );
    // 31 March 23:30 IST — the last half hour of the old year.
    expect(financialYearOf(new Date("2026-03-31T23:30:00+05:30"))).toBe(
      "2025-26",
    );
  });

  it("handles the turn of the century without producing a 3-digit suffix", () => {
    expect(financialYearOf(new Date("2099-05-01T00:00:00+05:30"))).toBe(
      "2099-00",
    );
  });
});

describe("formatInvoiceNumber", () => {
  it("produces a number within the 16-character limit of Rule 46(b)", () => {
    const number = formatInvoiceNumber("PDH", "2026-27", 1);
    expect(number).toBe("PDH/2627/000001");
    expect(number.length).toBeLessThanOrEqual(16);
  });

  it("pads the serial so numbers sort in issue order", () => {
    expect(formatInvoiceNumber("PDH", "2026-27", 42)).toBe("PDH/2627/000042");
  });

  /**
   * Fail at configuration time rather than issuing an over-long number that
   * only fails a compliance check months later, once it is already printed on
   * documents sent to customers.
   */
  it("refuses a prefix that pushes the number past 16 characters", () => {
    expect(() => formatInvoiceNumber("PRATIKARDIGITAL", "2026-27", 1)).toThrow(
      /16/,
    );
  });

  it("refuses characters Rule 46(b) does not allow", () => {
    expect(() => formatInvoiceNumber("PD#", "2026-27", 1)).toThrow(
      /does not allow/,
    );
  });
});

describe("splitTax", () => {
  it("splits intra-state supply into equal CGST and SGST", () => {
    expect(splitTax(3582, "19", "19")).toEqual({
      cgstAmount: 1791,
      sgstAmount: 1791,
      igstAmount: 0,
    });
  });

  it("charges IGST on an inter-state supply", () => {
    expect(splitTax(3582, "27", "19")).toEqual({
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 3582,
    });
  });

  /**
   * An odd number of paise cannot be halved evenly. The remainder has to land
   * somewhere, and the two heads must still add back to the tax actually
   * charged — otherwise the invoice disagrees with the payment by a paisa,
   * which is the kind of thing that fails a reconciliation.
   */
  it("keeps CGST + SGST exactly equal to the tax charged when it is odd", () => {
    const split = splitTax(1801, "19", "19");
    expect(split.cgstAmount).toBe(900);
    expect(split.sgstAmount).toBe(901);
    expect(split.cgstAmount + split.sgstAmount).toBe(1801);
  });

  it.each([0, 1, 2, 3, 99, 100, 3583, 999999])(
    "conserves the total for %i paise",
    (tax) => {
      const intra = splitTax(tax, "19", "19");
      expect(intra.cgstAmount + intra.sgstAmount + intra.igstAmount).toBe(tax);

      const inter = splitTax(tax, "27", "19");
      expect(inter.cgstAmount + inter.sgstAmount + inter.igstAmount).toBe(tax);
    },
  );
});

describe("resolvePlaceOfSupply", () => {
  it("uses the buyer's state when one is known", () => {
    expect(resolvePlaceOfSupply("27", "19")).toBe("27");
  });

  /**
   * IGST Act s12(2)(b): with no address on record for an unregistered buyer,
   * the place of supply is the supplier's location. We collect no address
   * today, so this is the live path for every sale.
   */
  it("falls back to the supplier's state when no buyer address is on record", () => {
    expect(resolvePlaceOfSupply(null, "19")).toBe("19");
    expect(resolvePlaceOfSupply("", "19")).toBe("19");
    expect(resolvePlaceOfSupply("   ", "19")).toBe("19");
  });
});

describe("formatRupees", () => {
  it.each([
    { paise: 0, expected: "0.00" },
    { paise: 5, expected: "0.05" },
    { paise: 100, expected: "1.00" },
    { paise: 19900, expected: "199.00" },
    { paise: 123456, expected: "1,234.56" },
    // Indian grouping: pairs above the last three digits, not triples.
    { paise: 12345678, expected: "1,23,456.78" },
    { paise: 1234567890, expected: "1,23,45,678.90" },
  ])("$paise paise → $expected", ({ paise, expected }) => {
    expect(formatRupees(paise)).toBe(expected);
  });
});
