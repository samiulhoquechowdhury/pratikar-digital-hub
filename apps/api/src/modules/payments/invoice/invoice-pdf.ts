import PDFDocument from "pdfkit";

import { formatRupees, stateName } from "./gst";
import type { SellerIdentity } from "./invoice-config";

export interface InvoiceView {
  /**
   * What this document is. A credit note is laid out identically to the
   * invoice it reverses — same supplier, same buyer, same tax heads — because
   * the reader is checking one against the other, and two different layouts
   * make that harder for no reason.
   */
  kind?: "invoice" | "credit-note";
  /** Only on a credit note: the invoice number being reversed. */
  reverses?: string;
  /** Only on a credit note: why. */
  reason?: string | null;
  invoiceNumber: string;
  issuedAt: Date;
  /** Null when the company's GST details aren't configured — see below. */
  seller: SellerIdentity | null;
  placeOfSupply: string;
  buyer: {
    name: string | null;
    email: string | null;
    phone: string | null;
    gstin: string | null;
  };
  description: string;
  sacCode: string;
  taxableAmount: number;
  taxRatePercent: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalAmount: number;
}

// pdfkit's built-in fonts use WinAnsi, which has no U+20B9. Writing "₹" with
// Helvetica produces a wrong glyph rather than an error, so the invoice would
// look fine in review and wrong in a customer's inbox. "Rs." is unambiguous
// and needs no embedded font.
const RUPEE = "Rs.";

const PAGE_MARGIN = 46;
const INK = "#1a1a1a";
const MUTED = "#5c5c5c";
const RULE = "#d4d4d4";

/**
 * Renders one invoice to a PDF buffer.
 *
 * Deliberately pdfkit rather than the docxtemplater + LibreOffice pipeline the
 * documents module uses: that pipeline exists to fill a *customer-supplied*
 * .docx, and it costs a LibreOffice process per render. An invoice is our own
 * fixed layout produced on every payment, so drawing it directly is both
 * faster and one less external binary in the payment path.
 */
export function renderInvoicePdf(view: InvoiceView): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", margin: PAGE_MARGIN });
  const chunks: Buffer[] = [];

  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  drawInvoice(doc, view);
  doc.end();
  return done;
}

function drawInvoice(doc: PDFKit.PDFDocument, view: InvoiceView): void {
  const { seller } = view;
  const right = doc.page.width - PAGE_MARGIN;
  const width = right - PAGE_MARGIN;

  // ── title ────────────────────────────────────────────────────────────────
  // An unconfigured deployment must not produce something that reads as a
  // valid tax invoice. It still gets a number and a full breakdown — the sale
  // is real and has to be recorded — but the document says what it is.
  const isNote = view.kind === "credit-note";
  const title = seller
    ? isNote
      ? "CREDIT NOTE"
      : "TAX INVOICE"
    : isNote
      ? "PROFORMA CREDIT NOTE — NOT VALID"
      : "PROFORMA — NOT A VALID TAX INVOICE";
  doc
    .fillColor(seller ? INK : "#8a1c1c")
    .font("Helvetica-Bold")
    .fontSize(seller ? 16 : 14)
    .text(title, { align: "center" });

  if (isNote && view.reverses) {
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor(MUTED)
      .text(`Reverses tax invoice ${view.reverses}`, { align: "center" });
  }

  if (!seller) {
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(MUTED)
      .text(
        "The supplier's GST registration details are not configured on this deployment.",
        { align: "center" },
      );
  }

  doc.moveDown(1.2);

  // ── supplier ─────────────────────────────────────────────────────────────
  const topY = doc.y;
  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor(INK)
    .text(seller?.legalName ?? "Pratikar Digital Hub", PAGE_MARGIN, topY, {
      width: width * 0.55,
    });
  doc.font("Helvetica").fontSize(9).fillColor(MUTED);
  if (seller) {
    doc.text(seller.address, { width: width * 0.55 });
    doc.text(`GSTIN: ${seller.gstin}`, { width: width * 0.55 });
    doc.text(`State: ${seller.stateCode} — ${stateName(seller.stateCode)}`, {
      width: width * 0.55,
    });
  } else {
    doc.text("Supplier address not configured", { width: width * 0.55 });
  }

  // ── invoice meta, right column ───────────────────────────────────────────
  const metaX = PAGE_MARGIN + width * 0.6;
  const metaWidth = width * 0.4;
  doc.font("Helvetica").fontSize(9).fillColor(INK);
  labelled(
    doc,
    isNote ? "Credit note no." : "Invoice no.",
    view.invoiceNumber,
    metaX,
    topY,
    metaWidth,
  );
  labelled(
    doc,
    "Date",
    view.issuedAt.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    }),
    metaX,
    topY + 15,
    metaWidth,
  );
  labelled(
    doc,
    "Place of supply",
    `${view.placeOfSupply} — ${stateName(view.placeOfSupply)}`,
    metaX,
    topY + 30,
    metaWidth,
  );

  doc.y = Math.max(doc.y, topY + 48);
  doc.moveDown(0.8);
  rule(doc);

  // ── buyer ────────────────────────────────────────────────────────────────
  doc.moveDown(0.6);
  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor(MUTED)
    .text("BILL TO", PAGE_MARGIN, doc.y);
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor(INK)
    .text(view.buyer.name ?? "Customer");
  const contact = [view.buyer.email, view.buyer.phone]
    .filter(Boolean)
    .join("  ·  ");
  if (contact) doc.fontSize(9).fillColor(MUTED).text(contact);
  doc
    .fontSize(9)
    .fillColor(MUTED)
    .text(
      view.buyer.gstin
        ? `GSTIN: ${view.buyer.gstin}`
        : "Unregistered (B2C supply)",
    );

  if (isNote && view.reason) {
    doc.moveDown(0.6);
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor(MUTED)
      .text(`Reason: ${view.reason}`, PAGE_MARGIN, doc.y, { width });
  }

  doc.moveDown(1);

  // ── line items ───────────────────────────────────────────────────────────
  const cols = layoutColumns(PAGE_MARGIN, width, view);
  drawTableHeader(doc, cols);
  drawTableRow(doc, cols, view);

  doc.moveDown(0.5);
  rule(doc);

  // ── totals ───────────────────────────────────────────────────────────────
  doc.moveDown(0.6);
  const totalsX = PAGE_MARGIN + width * 0.55;
  const totalsWidth = width * 0.45;

  total(doc, "Taxable value", view.taxableAmount, totalsX, totalsWidth);
  if (view.igstAmount > 0) {
    total(
      doc,
      `IGST @ ${view.taxRatePercent}%`,
      view.igstAmount,
      totalsX,
      totalsWidth,
    );
  } else {
    const half = view.taxRatePercent / 2;
    total(doc, `CGST @ ${half}%`, view.cgstAmount, totalsX, totalsWidth);
    total(doc, `SGST @ ${half}%`, view.sgstAmount, totalsX, totalsWidth);
  }

  doc.moveDown(0.3);
  doc
    .moveTo(totalsX, doc.y)
    .lineTo(right, doc.y)
    .strokeColor(RULE)
    .lineWidth(0.5)
    .stroke();
  doc.moveDown(0.4);

  doc.font("Helvetica-Bold").fontSize(11).fillColor(INK);
  const totalLabelY = doc.y;
  doc.text("Total", totalsX, totalLabelY, { width: totalsWidth * 0.5 });
  doc.text(
    `${RUPEE} ${formatRupees(view.totalAmount)}`,
    totalsX + totalsWidth * 0.5,
    totalLabelY,
    { width: totalsWidth * 0.5, align: "right" },
  );

  // ── footer ───────────────────────────────────────────────────────────────
  doc.moveDown(3);
  rule(doc);
  doc.moveDown(0.5);
  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(MUTED)
    .text(
      `This is a computer-generated ${isNote ? "credit note" : "invoice"} and is valid without a signature.`,
      PAGE_MARGIN,
      doc.y,
      { width, align: "center" },
    );
}

/** Column geometry — IGST and CGST/SGST never appear on the same invoice. */
function layoutColumns(x: number, width: number, view: InvoiceView) {
  const interState = view.igstAmount > 0;
  return {
    description: { x, width: width * 0.4 },
    sac: { x: x + width * 0.42, width: width * 0.12 },
    taxable: { x: x + width * 0.54, width: width * 0.14 },
    tax: { x: x + width * 0.68, width: width * 0.16 },
    total: { x: x + width * 0.84, width: width * 0.16 },
    taxLabel: interState
      ? `IGST ${view.taxRatePercent}%`
      : `CGST+SGST ${view.taxRatePercent}%`,
  };
}

type Columns = ReturnType<typeof layoutColumns>;

function drawTableHeader(doc: PDFKit.PDFDocument, cols: Columns): void {
  const y = doc.y;
  doc.font("Helvetica-Bold").fontSize(8).fillColor(MUTED);
  doc.text("DESCRIPTION", cols.description.x, y, {
    width: cols.description.width,
  });
  doc.text("SAC", cols.sac.x, y, { width: cols.sac.width });
  doc.text("TAXABLE", cols.taxable.x, y, {
    width: cols.taxable.width,
    align: "right",
  });
  doc.text(cols.taxLabel.toUpperCase(), cols.tax.x, y, {
    width: cols.tax.width,
    align: "right",
  });
  doc.text("TOTAL", cols.total.x, y, {
    width: cols.total.width,
    align: "right",
  });
  doc.y = y + 14;
  rule(doc);
  doc.moveDown(0.4);
}

function drawTableRow(
  doc: PDFKit.PDFDocument,
  cols: Columns,
  view: InvoiceView,
): void {
  const y = doc.y;
  const taxTotal = view.cgstAmount + view.sgstAmount + view.igstAmount;

  doc.font("Helvetica").fontSize(9).fillColor(INK);
  doc.text(view.description, cols.description.x, y, {
    width: cols.description.width,
  });
  const rowBottom = doc.y;

  doc.text(view.sacCode, cols.sac.x, y, { width: cols.sac.width });
  doc.text(formatRupees(view.taxableAmount), cols.taxable.x, y, {
    width: cols.taxable.width,
    align: "right",
  });
  doc.text(formatRupees(taxTotal), cols.tax.x, y, {
    width: cols.tax.width,
    align: "right",
  });
  doc.text(formatRupees(view.totalAmount), cols.total.x, y, {
    width: cols.total.width,
    align: "right",
  });

  // A long description wraps; the numeric cells don't. Take whichever ran
  // lower so the next row can't overlap the one above it.
  doc.y = Math.max(rowBottom, doc.y);
}

function labelled(
  doc: PDFKit.PDFDocument,
  label: string,
  value: string,
  x: number,
  y: number,
  width: number,
): void {
  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(MUTED)
    .text(label, x, y, { width: width * 0.45 });
  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor(INK)
    .text(value, x + width * 0.45, y, {
      width: width * 0.55,
      align: "right",
    });
}

function total(
  doc: PDFKit.PDFDocument,
  label: string,
  amount: number,
  x: number,
  width: number,
): void {
  const y = doc.y;
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(MUTED)
    .text(label, x, y, { width: width * 0.55 });
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(INK)
    .text(`${RUPEE} ${formatRupees(amount)}`, x + width * 0.55, y, {
      width: width * 0.45,
      align: "right",
    });
  doc.y = y + 14;
}

function rule(doc: PDFKit.PDFDocument): void {
  doc
    .moveTo(PAGE_MARGIN, doc.y)
    .lineTo(doc.page.width - PAGE_MARGIN, doc.y)
    .strokeColor(RULE)
    .lineWidth(0.5)
    .stroke();
}
