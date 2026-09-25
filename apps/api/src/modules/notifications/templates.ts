/**
 * The emails this system sends, as pure functions.
 *
 * Kept free of Nest, Prisma and the mail provider so the thing that actually
 * matters about an email — what it says, and whether the number in it is
 * right — can be tested without a transport.
 *
 * These are plain, deliberately. A customer who has just paid wants to know
 * what they bought, what it cost and where it is; a marketing layout with a
 * hero image buries all three and is more likely to land in a spam folder.
 */

const SITE_URL = () => process.env.PUBLIC_SITE_URL ?? "http://localhost:3001";

export interface RenderedEmail {
  subject: string;
  html: string;
}

/** Paise to the rupee string an email prints, e.g. 118000 -> "1,180.00". */
function rupees(paise: number): string {
  const rupeesPart = Math.floor(Math.abs(paise) / 100);
  const paisePart = String(Math.abs(paise) % 100).padStart(2, "0");
  const digits = String(rupeesPart);
  // Indian grouping: last three digits, then pairs.
  const grouped =
    digits.length <= 3
      ? digits
      : digits.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",") +
        "," +
        digits.slice(-3);
  return `${grouped}.${paisePart}`;
}

/**
 * Wraps body content in the one layout every email shares.
 *
 * Inline styles and a table-free single column on purpose: mail clients strip
 * <style> blocks, and Outlook's rendering engine is not a browser. Anything
 * cleverer than this renders differently in half the places it lands.
 */
function layout(heading: string, body: string): string {
  return `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111827;line-height:1.6">
  <p style="margin:0 0 4px;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#6b7280">Pratikar Digital Hub</p>
  <h1 style="margin:0 0 16px;font-size:20px;color:#0b1f3a">${heading}</h1>
  ${body}
  <p style="margin:28px 0 0;padding-top:16px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280">
    You're receiving this because of activity on your Pratikar Digital Hub account.
  </p>
</div>`;
}

function button(href: string, label: string): string {
  // Gold with near-black text — white on gold fails contrast, as the design
  // tokens note. An email cannot be fixed after it is sent.
  return `<p style="margin:24px 0"><a href="${href}" style="display:inline-block;background:#d4af37;color:#081729;text-decoration:none;font-weight:600;padding:11px 20px;border-radius:8px">${label}</a></p>`;
}

export interface PurchasePayload {
  customerName: string | null;
  /** What was bought, as the customer would name it. */
  itemTitle: string;
  /** Excluding GST, in paise. */
  amountInPaise: number;
  gstInPaise: number;
  /** Where to go next — the course, the document, the library item. */
  destinationPath: string;
  destinationLabel: string;
}

/**
 * Sent once an order is paid.
 *
 * Links to the dashboard rather than attaching the invoice: a signed download
 * URL expires in five minutes and would be dead before most people opened the
 * mail. The invoice is one click from the page this points at.
 */
export function purchaseConfirmation(p: PurchasePayload): RenderedEmail {
  const total = p.amountInPaise + p.gstInPaise;
  const site = SITE_URL();
  return {
    subject: `Your purchase is confirmed — ${p.itemTitle}`,
    html: layout(
      p.customerName ? `Thanks, ${p.customerName}` : "Thanks for your purchase",
      `<p style="margin:0 0 16px">Your payment went through and <strong>${p.itemTitle}</strong> is ready.</p>
  <table style="width:100%;border-collapse:collapse;font-size:14px;margin:0 0 8px">
    <tr><td style="padding:6px 0;color:#4b5563">Amount</td><td style="padding:6px 0;text-align:right">Rs ${rupees(p.amountInPaise)}</td></tr>
    <tr><td style="padding:6px 0;color:#4b5563">GST</td><td style="padding:6px 0;text-align:right">Rs ${rupees(p.gstInPaise)}</td></tr>
    <tr><td style="padding:10px 0;border-top:1px solid #e5e7eb;font-weight:600">Total paid</td><td style="padding:10px 0;border-top:1px solid #e5e7eb;text-align:right;font-weight:600">Rs ${rupees(total)}</td></tr>
  </table>
  ${button(`${site}${p.destinationPath}`, p.destinationLabel)}
  <p style="margin:0;font-size:14px;color:#4b5563">Your invoice is in <a href="${site}/dashboard#purchases" style="color:#6f561b">your account</a>.</p>`,
    ),
  };
}

export interface ReviewReadyPayload {
  customerName: string | null;
  documentTitle: string;
}

/** Sent when a reviewer returns a document. */
export function reviewReady(p: ReviewReadyPayload): RenderedEmail {
  const site = SITE_URL();
  return {
    subject: `Your reviewed document is ready — ${p.documentTitle}`,
    html: layout(
      p.customerName
        ? `${p.customerName}, your review is back`
        : "Your review is back",
      `<p style="margin:0 0 16px">A professional has finished reviewing <strong>${p.documentTitle}</strong>. Their corrections and comments are on the reviewed copy.</p>
  ${button(`${site}/dashboard#documents`, "Open your documents")}`,
    ),
  };
}

export interface RefundPayload {
  customerName: string | null;
  itemTitle: string;
  totalInPaise: number;
}

/**
 * Sent when an order is refunded.
 *
 * States plainly that access has ended, because it has — the enrolment is
 * expired and the download is closed at the same moment. Finding that out by
 * clicking a dead link is worse than being told.
 */
export function refundIssued(p: RefundPayload): RenderedEmail {
  return {
    subject: `Refund issued — ${p.itemTitle}`,
    html: layout(
      p.customerName
        ? `${p.customerName}, your refund is on its way`
        : "Your refund is on its way",
      `<p style="margin:0 0 16px">We've refunded <strong>Rs ${rupees(p.totalInPaise)}</strong> for ${p.itemTitle}. It usually reaches your account within 5–7 working days, depending on your bank.</p>
  <p style="margin:0 0 16px">Access to it has ended, and a credit note is in <a href="${SITE_URL()}/dashboard#purchases" style="color:#6f561b">your account</a> alongside the original invoice.</p>`,
    ),
  };
}
