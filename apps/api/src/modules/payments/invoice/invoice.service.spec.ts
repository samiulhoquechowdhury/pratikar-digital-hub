import { ForbiddenException } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import type { PrismaService } from "../../../prisma/prisma.service";
import type { StorageService } from "../../storage/storage.service";

import { InvoiceConfig } from "./invoice-config";
import { renderInvoicePdf } from "./invoice-pdf";
import { InvoiceService } from "./invoice.service";

const ORDER = {
  id: "ord-1",
  userId: "cust-1",
  itemType: "COURSE",
  amount: 100_000, // Rs 1,000.00
  gstAmount: 18_000, // Rs 180.00
  user: { name: "Asha Rao", email: "asha@example.com", phone: null },
  generatedDocument: null,
  contentLibraryItem: null,
  course: { title: "GST for Freelancers" },
};

/** A configured company, so tests exercise the real-invoice path by default. */
function withCompanyEnv(overrides: Record<string, string | undefined> = {}) {
  const env = {
    COMPANY_LEGAL_NAME: "Pratikar Digital Hub Pvt Ltd",
    COMPANY_GSTIN: "19AABCP1234F1Z5",
    COMPANY_ADDRESS: "12 Park Street\nKolkata 700016",
    COMPANY_STATE_CODE: "19",
    ...overrides,
  };
  const previous: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(env)) {
    previous[key] = process.env[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  return () => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  };
}

function build(
  opts: {
    existingInvoice?: unknown;
    createImpl?: jest.Mock;
    envOverrides?: Record<string, string | undefined>;
  } = {},
) {
  const restore = withCompanyEnv(opts.envOverrides);
  const config = new InvoiceConfig();
  restore();

  const created = {
    id: "inv-1",
    orderId: "ord-1",
    invoiceNumber: "PDH/2627/000001",
    createdAt: new Date("2026-08-01T10:00:00Z"),
    placeOfSupply: "19",
    taxableAmount: 100_000,
    taxRatePercent: 18,
    cgstAmount: 9_000,
    sgstAmount: 9_000,
    igstAmount: 0,
    totalAmount: 118_000,
    gstin: null,
    pdfKey: null,
  };

  const tx = {
    $queryRaw: jest.fn().mockResolvedValue([{ lastSequence: 1 }]),
    invoice: {
      create: opts.createImpl ?? jest.fn().mockResolvedValue(created),
    },
  };
  const prisma = {
    invoice: {
      findUnique: jest.fn().mockResolvedValue(opts.existingInvoice ?? null),
      update: jest.fn(),
    },
    order: { findUnique: jest.fn().mockResolvedValue(ORDER) },
    $transaction: jest.fn((cb: (client: typeof tx) => unknown) => cb(tx)),
  };
  const storage = {
    upload: jest.fn(),
    signUrl: jest.fn().mockReturnValue("https://signed.example/invoice.pdf"),
  };

  const service = new InvoiceService(
    prisma as unknown as PrismaService,
    storage as unknown as StorageService,
    config,
  );
  return { service, prisma, tx, storage, config, created };
}

/**
 * Reads the row the service tried to write, through an explicit type. Going
 * via `mock.calls` directly lands in `any`, and an `any` here would let a
 * renamed or dropped field pass this assertion silently — which is the one
 * thing these tests exist to catch.
 */
function invoiceWrittenBy(tx: {
  invoice: { create: jest.Mock };
}): Record<string, unknown> {
  const call = tx.invoice.create.mock.calls[0] as
    [{ data: Record<string, unknown> }] | undefined;
  if (!call) throw new Error("No invoice was written");
  return call[0].data;
}

describe("InvoiceService.issueForOrder", () => {
  it("snapshots the tax breakdown rather than leaving it to be recomputed", async () => {
    const { service, tx } = build();

    await service.issueForOrder("ord-1");

    expect(invoiceWrittenBy(tx)).toMatchObject({
      orderId: "ord-1",
      invoiceNumber: "PDH/2627/000001",
      financialYear: "2026-27",
      taxableAmount: 100_000,
      // Buyer has no address, so the supply is intra-state by the statutory
      // fallback and the tax splits into two heads.
      placeOfSupply: "19",
      cgstAmount: 9_000,
      sgstAmount: 9_000,
      igstAmount: 0,
      totalAmount: 118_000,
      taxRatePercent: 18,
    });
  });

  /**
   * Razorpay retries a webhook until it gets a 2xx, so this runs repeatedly
   * for one payment. A second invoice against one sale is a compliance
   * problem, not a duplicate row.
   */
  it("returns the existing invoice without allocating a second number", async () => {
    const existing = { id: "inv-1", invoiceNumber: "PDH/2627/000001" };
    const { service, tx, prisma } = build({ existingInvoice: existing });

    const result = await service.issueForOrder("ord-1");

    expect(result).toBe(existing);
    expect(tx.$queryRaw).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  /**
   * The check-then-write above is not enough on its own: two concurrent
   * deliveries can both find nothing. The unique constraint on orderId is the
   * real guard, and losing that race has to be survivable.
   */
  it("yields to a concurrent delivery that won the unique constraint", async () => {
    const raced = { id: "inv-1", invoiceNumber: "PDH/2627/000001" };
    const createImpl = jest.fn().mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("duplicate", {
        code: "P2002",
        clientVersion: "5.22.0",
      }),
    );
    const { service, prisma } = build({ createImpl });
    prisma.invoice.findUnique
      .mockResolvedValueOnce(null) // the pre-flight check
      .mockResolvedValueOnce(raced); // the re-read after losing the race

    await expect(service.issueForOrder("ord-1")).resolves.toBe(raced);
  });

  it("stores the rendered PDF under a key derived from the id, not the number", async () => {
    // The invoice number contains "/", which would silently become a path.
    const { service, storage, prisma } = build();

    await service.issueForOrder("ord-1");

    expect(storage.upload).toHaveBeenCalledWith(
      "invoices/inv-1.pdf",
      expect.any(Buffer),
      "application/pdf",
    );
    expect(prisma.invoice.update).toHaveBeenCalledWith({
      where: { id: "inv-1" },
      data: { pdfKey: "invoices/inv-1.pdf" },
    });
  });
});

describe("InvoiceService.getForOrder", () => {
  const stored = {
    ...{
      id: "inv-1",
      invoiceNumber: "PDH/2627/000001",
      createdAt: new Date("2026-08-01T10:00:00Z"),
      placeOfSupply: "19",
      taxableAmount: 100_000,
      taxRatePercent: 18,
      cgstAmount: 9_000,
      sgstAmount: 9_000,
      igstAmount: 0,
      totalAmount: 118_000,
      gstin: null,
      pdfKey: "invoices/inv-1.pdf",
    },
    order: { ...ORDER, userId: "cust-1" },
  };

  it("refuses to hand a customer someone else's invoice", async () => {
    const { service, prisma } = build();
    prisma.invoice.findUnique.mockResolvedValue(stored);

    await expect(service.getForOrder("ord-1", "cust-2")).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it("lets staff read any invoice", async () => {
    const { service, prisma } = build();
    prisma.invoice.findUnique.mockResolvedValue(stored);

    const result = await service.getForOrder("ord-1", null);

    expect(result?.invoiceNumber).toBe("PDH/2627/000001");
    expect(result?.downloadUrl).toBe("https://signed.example/invoice.pdf");
  });

  it("re-renders on demand when the PDF was never written", async () => {
    const { service, prisma, storage } = build();
    prisma.invoice.findUnique.mockResolvedValue({ ...stored, pdfKey: null });

    await service.getForOrder("ord-1", "cust-1");

    expect(storage.upload).toHaveBeenCalled();
  });

  it("returns null for an order that has no invoice", async () => {
    const { service, prisma } = build();
    prisma.invoice.findUnique.mockResolvedValue(null);

    await expect(service.getForOrder("ord-1", "cust-1")).resolves.toBeNull();
  });
});

/**
 * The PDF is what the customer actually receives, so it gets rendered for
 * real here rather than mocked — a layout that throws only at draw time would
 * otherwise pass every test and fail on the first live payment.
 */
describe("renderInvoicePdf", () => {
  const view = {
    invoiceNumber: "PDH/2627/000001",
    issuedAt: new Date("2026-08-01T10:00:00Z"),
    seller: {
      legalName: "Pratikar Digital Hub Pvt Ltd",
      gstin: "19AABCP1234F1Z5",
      address: "12 Park Street\nKolkata 700016",
      stateCode: "19",
    },
    placeOfSupply: "19",
    buyer: {
      name: "Asha Rao",
      email: "asha@example.com",
      phone: null,
      gstin: null,
    },
    description: "GST for Freelancers",
    sacCode: "999293",
    taxableAmount: 100_000,
    taxRatePercent: 18,
    cgstAmount: 9_000,
    sgstAmount: 9_000,
    igstAmount: 0,
    totalAmount: 118_000,
  };

  it("produces a PDF", async () => {
    const pdf = await renderInvoicePdf(view);

    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(pdf.byteLength).toBeGreaterThan(1000);
  });

  it("renders the inter-state variant without falling over", async () => {
    const pdf = await renderInvoicePdf({
      ...view,
      placeOfSupply: "27",
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 18_000,
    });

    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
  });

  it("renders the proforma variant when the company is unconfigured", async () => {
    const pdf = await renderInvoicePdf({ ...view, seller: null });

    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
  });
});

describe("InvoiceConfig", () => {
  it("treats a GSTIN whose state disagrees with COMPANY_STATE_CODE as unconfigured", () => {
    // Silently trusting either one would put a wrong CGST/SGST/IGST split on
    // every invoice the deployment ever issues.
    const restore = withCompanyEnv({ COMPANY_STATE_CODE: "27" });
    const config = new InvoiceConfig();
    restore();

    expect(config.isConfigured).toBe(false);
  });

  it("rejects a malformed GSTIN", () => {
    const restore = withCompanyEnv({ COMPANY_GSTIN: "NOTAGSTIN" });
    const config = new InvoiceConfig();
    restore();

    expect(config.isConfigured).toBe(false);
  });

  it("accepts a consistent configuration", () => {
    const restore = withCompanyEnv();
    const config = new InvoiceConfig();
    restore();

    expect(config.isConfigured).toBe(true);
    expect(config.sellerStateCode).toBe("19");
  });
});
