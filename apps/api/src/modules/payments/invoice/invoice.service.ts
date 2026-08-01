import { ForbiddenException, Injectable, Logger } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../../../prisma/prisma.service";
import { StorageService } from "../../storage/storage.service";

import { allocateInvoiceNumber } from "./allocate-number";
import { resolvePlaceOfSupply, splitTax } from "./gst";
import { InvoiceConfig } from "./invoice-config";
import { renderInvoicePdf, type InvoiceView } from "./invoice-pdf";

/** The order shape this service needs, so callers can pass a plain row. */
const ORDER_INCLUDE = {
  user: { select: { name: true, email: true, phone: true } },
  generatedDocument: { include: { template: { select: { title: true } } } },
  contentLibraryItem: { select: { title: true } },
  course: { select: { title: true } },
} satisfies Prisma.OrderInclude;

type OrderWithItem = Prisma.OrderGetPayload<{ include: typeof ORDER_INCLUDE }>;

@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly config: InvoiceConfig,
  ) {}

  /**
   * Issues the invoice for a paid order, or returns the one already issued.
   *
   * Called from the webhook, which Razorpay retries until it gets a 2xx, so
   * this has to be safe to call repeatedly for the same order — a second
   * invoice for one payment is a compliance problem, not a duplicate row.
   * `Invoice.orderId` is unique, which makes the database the arbiter rather
   * than a check-then-write that two concurrent deliveries could both pass.
   */
  async issueForOrder(orderId: string) {
    const existing = await this.prisma.invoice.findUnique({
      where: { orderId },
    });
    if (existing) return existing;

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: ORDER_INCLUDE,
    });
    if (!order) throw new Error(`Order ${orderId} not found`);

    const issuedAt = new Date();
    // No address is collected anywhere yet, so this is null on every sale
    // today and the statutory fallback in resolvePlaceOfSupply applies. The
    // moment a buyer state exists it flows through without touching the split.
    const buyerStateCode: string | null = null;
    const placeOfSupply = resolvePlaceOfSupply(
      buyerStateCode,
      this.config.sellerStateCode,
    );
    const tax = splitTax(
      order.gstAmount,
      placeOfSupply,
      this.config.sellerStateCode,
    );

    let invoice;
    try {
      invoice = await this.prisma.$transaction(async (tx) => {
        // Inside the transaction so a failure below rolls the counter back and
        // leaves no gap in the series.
        const allocated = await allocateInvoiceNumber(
          tx,
          this.config.numberPrefix,
          issuedAt,
        );

        return tx.invoice.create({
          data: {
            orderId: order.id,
            invoiceNumber: allocated.invoiceNumber,
            financialYear: allocated.financialYear,
            gstin: null,
            taxableAmount: order.amount,
            cgstAmount: tax.cgstAmount,
            sgstAmount: tax.sgstAmount,
            igstAmount: tax.igstAmount,
            totalAmount: order.amount + order.gstAmount,
            taxRatePercent: ratePercentOf(order.amount, order.gstAmount),
            placeOfSupply,
            createdAt: issuedAt,
          },
        });
      });
    } catch (err) {
      // A concurrent delivery beat us to it. Its invoice is as good as ours.
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        const raced = await this.prisma.invoice.findUnique({
          where: { orderId },
        });
        if (raced) return raced;
      }
      throw err;
    }

    // Rendering is deliberately outside the transaction and after the row is
    // committed: the invoice legally exists once it is numbered and recorded,
    // and a PDF that fails to draw must not roll back the record of a sale.
    await this.renderAndStore(invoice.id, order, invoice);
    return invoice;
  }

  /**
   * The invoice for an order, with a short-lived download URL.
   *
   * `requesterId` is null for staff, who may read any invoice. For a customer
   * it is their own id from the token, checked against the order's owner —
   * an invoice carries a name, contact details and what somebody bought.
   */
  async getForOrder(orderId: string, requesterId: string | null) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { orderId },
      include: { order: { include: ORDER_INCLUDE } },
    });
    if (!invoice) return null;
    if (requesterId !== null && invoice.order.userId !== requesterId) {
      // Not 404: the caller asked about an order that exists and isn't theirs.
      throw new ForbiddenException("NOT_YOUR_ORDER");
    }

    // Re-render on demand if the PDF never got written — the row is the
    // invoice, so a missing rendering is recoverable rather than terminal.
    let key = invoice.pdfKey;
    if (!key) {
      key = await this.renderAndStore(invoice.id, invoice.order, invoice);
    }

    return {
      invoiceNumber: invoice.invoiceNumber,
      issuedAt: invoice.createdAt,
      taxableAmount: invoice.taxableAmount,
      cgstAmount: invoice.cgstAmount,
      sgstAmount: invoice.sgstAmount,
      igstAmount: invoice.igstAmount,
      totalAmount: invoice.totalAmount,
      taxRatePercent: invoice.taxRatePercent,
      placeOfSupply: invoice.placeOfSupply,
      isProforma: !this.config.isConfigured,
      downloadUrl: this.storage.signUrl(key),
    };
  }

  private async renderAndStore(
    invoiceId: string,
    order: OrderWithItem,
    invoice: {
      invoiceNumber: string;
      createdAt: Date;
      placeOfSupply: string;
      taxableAmount: number;
      taxRatePercent: number;
      cgstAmount: number;
      sgstAmount: number;
      igstAmount: number;
      totalAmount: number;
      gstin: string | null;
    },
  ): Promise<string> {
    const view: InvoiceView = {
      invoiceNumber: invoice.invoiceNumber,
      issuedAt: invoice.createdAt,
      seller: this.config.seller,
      placeOfSupply: invoice.placeOfSupply,
      buyer: {
        name: order.user.name,
        email: order.user.email,
        phone: order.user.phone,
        gstin: invoice.gstin,
      },
      description: describeOrder(order),
      sacCode: this.config.sacFor(order.itemType),
      taxableAmount: invoice.taxableAmount,
      taxRatePercent: invoice.taxRatePercent,
      cgstAmount: invoice.cgstAmount,
      sgstAmount: invoice.sgstAmount,
      igstAmount: invoice.igstAmount,
      totalAmount: invoice.totalAmount,
    };

    const pdf = await renderInvoicePdf(view);
    // Keyed by id, not by invoice number: the number contains "/".
    const key = `invoices/${invoiceId}.pdf`;
    await this.storage.upload(key, pdf, "application/pdf");
    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: { pdfKey: key },
    });

    this.logger.log(`Invoice ${invoice.invoiceNumber} rendered to ${key}`);
    return key;
  }
}

/** What the customer sees on the line item. */
function describeOrder(order: OrderWithItem): string {
  switch (order.itemType) {
    case "DOCUMENT":
      return order.generatedDocument?.template.title ?? "Legal document";
    case "DOCUMENT_REVIEW":
      return `${order.generatedDocument?.template.title ?? "Legal document"} — professional review`;
    case "CONTENT_ITEM":
      return order.contentLibraryItem?.title ?? "Content library item";
    case "COURSE":
      return order.course?.title ?? "Online course";
    default:
      return "Professional services";
  }
}

/**
 * Recovers the rate from the amounts actually charged rather than reading
 * GST_RATE, so an invoice raised today still prints the rate that produced its
 * own numbers after the constant changes.
 */
function ratePercentOf(taxableAmount: number, gstAmount: number): number {
  if (taxableAmount === 0) return 0;
  return Math.round((gstAmount / taxableAmount) * 100);
}
