import { Injectable, Logger } from "@nestjs/common";
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

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    // No Resend account is provisioned yet in local dev (implementation-plan.md
    // Milestone 1 item 1 is still pending) — fall back to logging the email
    // instead of failing every OTP request until an account exists.
    this.resend = apiKey ? new Resend(apiKey) : null;
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    if (!this.resend) {
      this.logger.warn(
        `RESEND_API_KEY not set — logging email instead of sending. To: ${to} | Subject: ${subject} | Body: ${html}`,
      );
      return;
    }

    const { error } = await this.resend.emails.send({
      from: this.fromAddress,
      to,
      subject,
      html,
    });

    if (error) {
      throw new Error(`Resend send failed: ${error.message}`);
    }
  }
}
