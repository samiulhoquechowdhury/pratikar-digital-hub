import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from "@nestjs/common";
import { Resend } from "resend";

/**
 * Single internal send() surface for email/SMS/push (docs/trd.md Section 4.5)
 * — callers never touch a provider SDK directly, so swapping Resend later
 * doesn't ripple through every module that sends notifications.
 *
 * Only email is wired for real right now: SMS is gated on the client's DLT
 * registration (docs/implementation-plan.md, Open blockers #1) and push
 * arrives with the Android app in Milestone 5.
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly resend: Resend | null;
  private readonly fromAddress =
    process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

  /**
   * Outside production, a failed send falls back to logging the message so
   * development doesn't depend on mail actually being deliverable. In
   * production it never does — see sendEmail.
   */
  private readonly isProduction = process.env.NODE_ENV === "production";

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    this.resend = apiKey ? new Resend(apiKey) : null;

    if (!this.resend) {
      this.logger.warn(
        "RESEND_API_KEY not set — emails will be logged instead of sent.",
      );
    } else if (this.fromAddress.endsWith("@resend.dev")) {
      // Resend's shared test domain only delivers to the account owner's own
      // address. Everyone else gets rejected, which looks like a broken login
      // rather than a configuration gap unless it's said out loud at boot.
      this.logger.warn(
        `Sending from ${this.fromAddress} — Resend's test domain only delivers ` +
          "to your own account address. Verify a real domain before anyone else needs email.",
      );
    }
  }

  /**
   * Sends an email, or fails loudly.
   *
   * The fallback below is deliberately scoped to non-production. Swallowing a
   * delivery failure in production would mean a customer waits forever for an
   * OTP that was never sent, and nothing would page anyone — the failure would
   * only show up as unexplained drop-off. Locally the opposite is true: the
   * test domain rejects every address except the account owner's, so without
   * this only one person could ever sign in.
   */
  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    if (!this.resend) {
      this.logDeliverable(to, subject, html, "no API key configured");
      return;
    }

    const { error } = await this.resend.emails.send({
      from: this.fromAddress,
      to,
      subject,
      html,
    });

    if (!error) return;

    if (this.isProduction) {
      this.logger.error(`Resend rejected mail to ${to}: ${error.message}`);
      // A known, expected failure — not an internal error. The caller can turn
      // this into "we couldn't send your code, try again", which is something
      // a user can act on, unlike a 500.
      throw new ServiceUnavailableException("EMAIL_DELIVERY_FAILED");
    }

    this.logDeliverable(to, subject, html, error.message);
  }

  /**
   * Logs a message that couldn't be sent. The body is included in full and on
   * purpose: it carries the OTP, which is the only way to sign in when mail
   * isn't deliverable. That makes these logs sensitive — they're a
   * development affordance, and this branch is unreachable in production.
   */
  private logDeliverable(
    to: string,
    subject: string,
    html: string,
    reason: string,
  ): void {
    this.logger.warn(
      `Email not sent (${reason}) — logging instead. To: ${to} | Subject: ${subject} | Body: ${html}`,
    );
  }
}
