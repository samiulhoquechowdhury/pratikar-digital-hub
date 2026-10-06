import { Injectable, Logger } from "@nestjs/common";

/** The SMS messages this system sends, each a DLT-registered template. */
export type SmsTemplate = "document-ready";

/** Env var holding each template's MSG91 template ID. */
const TEMPLATE_ENV: Record<SmsTemplate, string> = {
  "document-ready": "MSG91_TEMPLATE_DOCUMENT_READY",
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

  templateId(template: SmsTemplate): string {
    return process.env[TEMPLATE_ENV[template]] ?? "";
  }

  get isConfigured(): boolean {
    return Boolean(process.env.MSG91_API_KEY);
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
    const authKey = process.env.MSG91_API_KEY;
    if (!authKey || !templateId) {
      this.logger.log(
        `SMS "${template}" not sent — MSG91 not configured (${phone.slice(0, 4)}…, ${JSON.stringify(variables)})`,
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
