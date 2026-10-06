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

/** The customer website. 3001 is the admin panel locally, never this. */
const SITE_URL = () => process.env.PUBLIC_SITE_URL ?? "http://localhost:3000";

/** The admin panel, for the emails staff receive. */
const ADMIN_URL = () => process.env.ADMIN_SITE_URL ?? "http://localhost:3001";

/**
 * Escapes text for the email's HTML. Names are typed by customers and titles
 * by staff; either could contain markup, and a customer's name is quoted in
 * the alerts staff receive — unescaped, it could put a link of anyone's
 * choosing in the team's inbox.
 */
export function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

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
      p.customerName
        ? `Thanks, ${esc(p.customerName)}`
        : "Thanks for your purchase",
      `<p style="margin:0 0 16px">Your payment went through and <strong>${esc(p.itemTitle)}</strong> is ready.</p>
  <table style="width:100%;border-collapse:collapse;font-size:14px;margin:0 0 8px">
    <tr><td style="padding:6px 0;color:#4b5563">Amount</td><td style="padding:6px 0;text-align:right">Rs ${rupees(p.amountInPaise)}</td></tr>
    <tr><td style="padding:6px 0;color:#4b5563">GST</td><td style="padding:6px 0;text-align:right">Rs ${rupees(p.gstInPaise)}</td></tr>
    <tr><td style="padding:10px 0;border-top:1px solid #e5e7eb;font-weight:600">Total paid</td><td style="padding:10px 0;border-top:1px solid #e5e7eb;text-align:right;font-weight:600">Rs ${rupees(total)}</td></tr>
  </table>
  ${button(`${site}${p.destinationPath}`, p.destinationLabel)}
  <p style="margin:0;font-size:14px;color:#4b5563">Your invoice is in <a href="${site}/dashboard/orders" style="color:#6f561b">your account</a>.</p>`,
    ),
  };
}

export interface ReviewReadyPayload {
  customerName: string | null;
  documentTitle: string;
  /** The generated document, so the button opens it directly. */
  documentId: string;
}

/** Sent when a reviewer returns a document. */
export function reviewReady(p: ReviewReadyPayload): RenderedEmail {
  const site = SITE_URL();
  return {
    subject: `Your reviewed document is ready — ${p.documentTitle}`,
    html: layout(
      p.customerName
        ? `${esc(p.customerName)}, your review is back`
        : "Your review is back",
      `<p style="margin:0 0 16px">An advocate has finished reviewing <strong>${esc(p.documentTitle)}</strong>. The reviewed document is ready to download from your account, with any comments they left.</p>
  ${button(`${site}/dashboard/documents/${encodeURIComponent(p.documentId)}`, "Download your document")}`,
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
        ? `${esc(p.customerName)}, your refund is on its way`
        : "Your refund is on its way",
      `<p style="margin:0 0 16px">We've refunded <strong>Rs ${rupees(p.totalInPaise)}</strong> for ${esc(p.itemTitle)}. It usually reaches your account within 5–7 working days, depending on your bank.</p>
  <p style="margin:0 0 16px">Access to it has ended, and a credit note is in <a href="${SITE_URL()}/dashboard/orders" style="color:#6f561b">your account</a> alongside the original invoice.</p>`,
    ),
  };
}

const formatDate = (date: Date) =>
  date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });

export interface CertificatePayload {
  customerName: string | null;
  courseTitle: string;
  enrollmentId: string;
  verificationCode: string;
}

/**
 * Sent the moment a course is completed and its certificate issued. Carries
 * the public verification link too, because the first thing people do with
 * a certificate is send it to someone who wants to check it.
 */
export function certificateIssued(p: CertificatePayload): RenderedEmail {
  const site = SITE_URL();
  const verifyUrl = `${site}/verify/${encodeURIComponent(p.verificationCode)}`;
  return {
    subject: `Your certificate is ready — ${p.courseTitle}`,
    html: layout(
      p.customerName
        ? `Congratulations, ${esc(p.customerName)}`
        : "Congratulations",
      `<p style="margin:0 0 16px">You've completed <strong>${esc(p.courseTitle)}</strong>, and your certificate has been issued.</p>
  ${button(`${site}/learn/${encodeURIComponent(p.enrollmentId)}/certificate`, "View your certificate")}
  <p style="margin:0;font-size:14px;color:#4b5563">Anyone can check it is genuine at <a href="${verifyUrl}" style="color:#6f561b">${esc(verifyUrl)}</a> — no account needed.</p>`,
    ),
  };
}

export interface CourseExpiringPayload {
  customerName: string | null;
  courseTitle: string;
  enrollmentId: string;
  expiresAt: Date;
  /** Lessons done and in total, when known, so the email can say how close they are. */
  progress: { done: number; total: number } | null;
}

/**
 * Sent once, about a week before course access ends (docs/srs.md 3.5, 3.8).
 * Only to learners who haven't finished: a certificate already earned is
 * kept after expiry, so there's nothing to warn them about.
 */
export function courseExpiring(p: CourseExpiringPayload): RenderedEmail {
  const site = SITE_URL();
  const left =
    p.progress && p.progress.total > p.progress.done
      ? `<p style="margin:0 0 16px">You've finished ${p.progress.done} of ${p.progress.total} lessons.</p>`
      : "";
  return {
    subject: `Your access to ${p.courseTitle} ends on ${formatDate(p.expiresAt)}`,
    html: layout(
      p.customerName
        ? `${esc(p.customerName)}, your course access ends soon`
        : "Your course access ends soon",
      `<p style="margin:0 0 16px">Access to <strong>${esc(p.courseTitle)}</strong> ends on <strong>${formatDate(p.expiresAt)}</strong>. Finish the remaining lessons before then to earn your certificate — you keep the certificate after access ends.</p>
  ${left}
  ${button(`${site}/learn/${encodeURIComponent(p.enrollmentId)}`, "Continue the course")}`,
    ),
  };
}

export interface StaffNewOrderPayload {
  customerName: string | null;
  customerContact: string | null;
  itemTitle: string;
  itemKind: string;
  totalInPaise: number;
}

/** To staff, when an order is paid (docs/srs.md 3.8, admin-side). */
export function staffNewOrder(p: StaffNewOrderPayload): RenderedEmail {
  const who = p.customerName ?? p.customerContact ?? "A customer";
  return {
    subject: `New order: ${p.itemTitle} — Rs ${rupees(p.totalInPaise)}`,
    html: layout(
      "New paid order",
      `<p style="margin:0 0 16px"><strong>${esc(who)}</strong> bought <strong>${esc(p.itemTitle)}</strong> (${esc(p.itemKind)}) for <strong>Rs ${rupees(p.totalInPaise)}</strong>, GST included.</p>
  ${button(`${ADMIN_URL()}/orders`, "Open orders")}`,
    ),
  };
}

export interface StaffReviewRequestedPayload {
  customerName: string | null;
  documentTitle: string;
}

/**
 * To staff, when a customer pays for a lawyer review — the queue only helps
 * if someone knows there's something in it.
 */
export function staffReviewRequested(
  p: StaffReviewRequestedPayload,
): RenderedEmail {
  return {
    subject: `Review requested: ${p.documentTitle}`,
    html: layout(
      "A document is waiting for review",
      `<p style="margin:0 0 16px">${p.customerName ? `<strong>${esc(p.customerName)}</strong>` : "A customer"} has paid for an advocate review of <strong>${esc(p.documentTitle)}</strong>.</p>
  ${button(`${ADMIN_URL()}/reviews`, "Open the review queue")}`,
    ),
  };
}
