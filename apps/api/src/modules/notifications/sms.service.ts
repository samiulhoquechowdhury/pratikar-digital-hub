import { Injectable, Logger, Optional } from "@nestjs/common";

import {
  IntegrationsService,
  liveSetting,
} from "../integrations/integrations.service";

/** The SMS messages this system sends, each a DLT-registered template. */
export type SmsTemplate = "document-ready" | "login-otp";

/** Env var holding each template's MSG91 template ID. */
const TEMPLATE_ENV: Record<
  SmsTemplate,
  "MSG91_TEMPLATE_DOCUMENT_READY" | "MSG91_TEMPLATE_LOGIN_OTP"
> = {
  "document-ready": "MSG91_TEMPLATE_DOCUMENT_READY",
  "login-otp": "MSG91_TEMPLATE_LOGIN_OTP",
};

const FLOW_URL = "https://control.msg91.com/api/v5/flow";

/**
 * Text messages, through MSG91's Flow API.
 *
 * In India every commercial SMS has to match a template registered on DLT,
 * word for word, so the message text does not live here — it lives in the
 * template MSG91 holds, and this sends the template's ID and its variables.
 * Until the client's DLT registration clears there is no template ID, and
 * this logs what it would have sent instead.
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  // Keys are read on every send, so one saved in Integrations works at once.
  constructor(
    @Optional() private readonly integrations?: IntegrationsService,
  ) {}

  templateId(template: SmsTemplate): string {
    return liveSetting(this.integrations, TEMPLATE_ENV[template]);
  }

  get isConfigured(): boolean {
    return Boolean(liveSetting(this.integrations, "MSG91_API_KEY"));
  }

  /** Whether this template can actually go out: a key and its template ID. */
  canSend(template: SmsTemplate): boolean {
    return this.isConfigured && Boolean(this.templateId(template));
  }

  /**
   * Sends one templated SMS. `phone` is as stored on the account; MSG91
   * wants country code and number, no plus. Throws on a rejected send so the
   * queue retries it.
   */
  async send(
    phone: string,
    template: SmsTemplate,
    variables: Record<string, string>,
  ): Promise<void> {
    const templateId = this.templateId(template);
    const authKey = liveSetting(this.integrations, "MSG91_API_KEY");
    if (!authKey || !templateId) {
      // The variables stay out of the log: for "login-otp" they are the code.
      this.logger.log(
        `SMS "${template}" not sent — MSG91 not configured (${phone.slice(0, 4)}…)`,
      );
      return;
    }

    const response = await fetch(FLOW_URL, {
      method: "POST",
      headers: { authkey: authKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        template_id: templateId,
        short_url: "0",
        recipients: [{ mobiles: msg91Number(phone), ...variables }],
      }),
    });
    if (!response.ok) {
      throw new Error(
        `MSG91 rejected "${template}": ${response.status} ${await response.text()}`,
      );
    }
  }
}

/** "+91 98765 43210" or "9876543210" -> "919876543210". */
export function msg91Number(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 10 ? `91${digits}` : digits;
}
