import { ForbiddenException, Injectable, Logger } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../../../prisma/prisma.service";
import { StorageService } from "../../storage/storage.service";

import { allocateDocumentNumber } from "./allocate-number";
import { InvoiceConfig } from "./invoice-config";
import { renderInvoicePdf, type InvoiceView } from "./invoice-pdf";

/** Its own series, so credit notes number consecutively among themselves. */
const CREDIT_NOTE_PREFIX = "CRN";

const ORDER_INCLUDE = {
  user: { select: { name: true, email: true, phone: true } },
  generatedDocument: { include: { template: { select: { title: true } } } },
  contentLibraryItem: { select: { title: true } },
  course: { select: { title: true } },
} satisfies Prisma.OrderInclude;

@Injectable()
export class CreditNoteService {
  private readonly logger = new Logger(CreditNoteService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly config: InvoiceConfig,
  ) {}

  /**
   * Reverses an invoice under CGST s34.
   *
   * A refund does not delete or amend the invoice. The supply happened, and
   * the invoice is a true record of what was charged on that date — both
   * parties have already reported it. Cancelling it is a separate numbered
   * document, which is what this issues.
   *
   * Amounts are copied from the invoice rather than recomputed. A credit note
   * has to reverse exactly what was charged; recalculating would silently
   * diverge the day a rate or a place-of-supply rule changes, and a note that
   * credits a different figure from the invoice it names is worse than none.
   */
  async issueForRefundedOrder(orderId: string, reason?: string) {
    const existing = await this.prisma.creditNote.findUnique({
      where: { orderId },
    });
    if (existing) return existing;

    const invoice = await this.prisma.invoice.findUnique({
      where: { orderId },
      include: { order: { include: ORDER_INCLUDE } },
    });
    // Nothing to reverse. An order refunded before its invoice was raised is
    // a real sequence — the webhook could have failed after payment — and a
    // credit note against no invoice would be a document about nothing.
    if (!invoice) return null;

    const issuedAt = new Date();
    let note;
    try {
      note = await this.prisma.$transaction(async (tx) => {
        const allocated = await allocateDocumentNumber(
          tx,
          "CRN",
          CREDIT_NOTE_PREFIX,
          issuedAt,
        );
        return tx.creditNote.create({
          data: {
            orderId,
            invoiceId: invoice.id,
            noteNumber: allocated.number,
            financialYear: allocated.financialYear,
            taxableAmount: invoice.taxableAmount,
            cgstAmount: invoice.cgstAmount,
            sgstAmount: invoice.sgstAmount,
            igstAmount: invoice.igstAmount,
            totalAmount: invoice.totalAmount,
            taxRatePercent: invoice.taxRatePercent,
            placeOfSupply: invoice.placeOfSupply,
            reason: reason ?? null,
            createdAt: issuedAt,
          },
        });
      });
    } catch (err) {
      // Two refund attempts raced. The other one's note is as good as ours.
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        const raced = await this.prisma.creditNote.findUnique({
          where: { orderId },
        });
        if (raced) return raced;
      }
      throw err;
    }

    await this.render(note.id, invoice.order, note, invoice.invoiceNumber);
    return note;
  }

  /** The credit note for an order, with a short-lived download URL. */
  async getForOrder(orderId: string, requesterId: string | null) {
    const note = await this.prisma.creditNote.findUnique({
      where: { orderId },
      include: {
        invoice: { select: { invoiceNumber: true } },
        order: { include: ORDER_INCLUDE },
      },
    });
    if (!note) return null;
    if (requesterId !== null && note.order.userId !== requesterId) {
      throw new ForbiddenException("NOT_YOUR_ORDER");
    }

    let key = note.pdfKey;
    if (!key) {
      key = await this.render(
        note.id,
        note.order,
        note,
        note.invoice.invoiceNumber,
      );
    }

    return {
      noteNumber: note.noteNumber,
      issuedAt: note.createdAt,
      reverses: note.invoice.invoiceNumber,
      reason: note.reason,
      taxableAmount: note.taxableAmount,
      cgstAmount: note.cgstAmount,
      sgstAmount: note.sgstAmount,
      igstAmount: note.igstAmount,
      totalAmount: note.totalAmount,
      taxRatePercent: note.taxRatePercent,
      placeOfSupply: note.placeOfSupply,
      isProforma: !this.config.isConfigured,
      downloadUrl: this.storage.signUrl(key),
    };
  }

  private async render(
    noteId: string,
    order: Prisma.OrderGetPayload<{ include: typeof ORDER_INCLUDE }>,
    note: {
      noteNumber: string;
      createdAt: Date;
      placeOfSupply: string;
      taxableAmount: number;
      taxRatePercent: number;
      cgstAmount: number;
      sgstAmount: number;
      igstAmount: number;
      totalAmount: number;
      reason: string | null;
    },
    reverses: string,
  ): Promise<string> {
    const view: InvoiceView = {
      kind: "credit-note",
      reverses,
      reason: note.reason,
      invoiceNumber: note.noteNumber,
      issuedAt: note.createdAt,
      seller: this.config.seller,
      placeOfSupply: note.placeOfSupply,
      buyer: {
        name: order.user.name,
        email: order.user.email,
        phone: order.user.phone,
        gstin: null,
      },
      description: describeOrder(order),
      sacCode: this.config.sacFor(order.itemType),
      taxableAmount: note.taxableAmount,
      taxRatePercent: note.taxRatePercent,
      cgstAmount: note.cgstAmount,
      sgstAmount: note.sgstAmount,
      igstAmount: note.igstAmount,
      totalAmount: note.totalAmount,
    };

    const pdf = await renderInvoicePdf(view);
    const key = `credit-notes/${noteId}.pdf`;
    await this.storage.upload(key, pdf, "application/pdf");
    await this.prisma.creditNote.update({
      where: { id: noteId },
      data: { pdfKey: key },
    });
    this.logger.log(`Credit note ${note.noteNumber} rendered to ${key}`);
    return key;
  }
}

function describeOrder(
  order: Prisma.OrderGetPayload<{ include: typeof ORDER_INCLUDE }>,
): string {
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
