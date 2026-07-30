import { createHmac, timingSafeEqual } from "node:crypto";

import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";

// Thin wrapper around Razorpay's HTTP API. Kept as a separate service (rather
// than inline in PaymentsService) so it's the one place that changes if we
// ever swap payment providers — nothing else should import the Razorpay SDK
// directly.
//
// Uses global fetch rather than the `razorpay` npm package: we need exactly two
// endpoints, and the SDK would add a dependency (plus its own transitive tree)
// for the sake of a Basic-auth header.

const API_BASE = "https://api.razorpay.com/v1";

/** Razorpay is an external network hop; don't let a hung socket hold a request. */
const TIMEOUT_MS = 15_000;

/** Shape of Razorpay's error envelope: `{ error: { code, description, ... } }`. */
interface RazorpayErrorBody {
  error?: { code?: string; description?: string; reason?: string };
}

@Injectable()
export class RazorpayService {
  private readonly logger = new Logger(RazorpayService.name);

  private readonly keyId = process.env.RAZORPAY_KEY_ID ?? "";
  private readonly keySecret = process.env.RAZORPAY_KEY_SECRET ?? "";
  private readonly webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET ?? "";

  /**
   * Creates the Razorpay order the checkout widget is opened against.
   *
   * `receipt` is our own order id — it's what lets support reconcile a
   * Razorpay dashboard row back to a row in our database.
   */
  async createOrder(
    amountInPaise: number,
    receipt: string,
  ): Promise<{ id: string }> {
    const order = await this.post<{ id: string }>("/orders", {
      amount: amountInPaise,
      currency: "INR",
      // Razorpay caps this at 40 characters and rejects anything longer.
      receipt: receipt.slice(0, 40),
    });
    return { id: order.id };
  }

  /**
   * Verifies X-Razorpay-Signature against the raw webhook body — docs/trd.md
   * Section 4.4: never trust a client-reported payment status, only this.
   */
  verifyWebhookSignature(rawBody: string, signatureHeader: string): boolean {
    // An empty secret would still produce a valid-looking HMAC, so a
    // misconfigured deployment would accept forged webhooks. Fail closed.
    if (!this.webhookSecret) {
      this.logger.error(
        "RAZORPAY_WEBHOOK_SECRET is not set — rejecting all webhooks",
      );
      return false;
    }
    if (!signatureHeader) return false;

    const expected = createHmac("sha256", this.webhookSecret)
      .update(rawBody)
      .digest("hex");
    const expectedBuf = Buffer.from(expected);
    const actualBuf = Buffer.from(signatureHeader);
    if (expectedBuf.length !== actualBuf.length) return false;
    return timingSafeEqual(expectedBuf, actualBuf);
  }

  /**
   * Reverses a captured payment.
   *
   * `idempotencyKey` matters here: if our database write fails after Razorpay
   * has already accepted the refund, the retry must not move money twice.
   * Razorpay dedupes on this header and replays the original response.
   */
  async refund(
    razorpayPaymentId: string,
    amountInPaise: number,
    idempotencyKey?: string,
  ): Promise<{ id: string }> {
    const refund = await this.post<{ id: string }>(
      `/payments/${encodeURIComponent(razorpayPaymentId)}/refund`,
      { amount: amountInPaise },
      idempotencyKey,
    );
    return { id: refund.id };
  }

  private async post<T>(
    path: string,
    body: unknown,
    idempotencyKey?: string,
  ): Promise<T> {
    if (!this.keyId || !this.keySecret) {
      throw new InternalServerErrorException("RAZORPAY_NOT_CONFIGURED");
    }

    const credentials = Buffer.from(`${this.keyId}:${this.keySecret}`).toString(
      "base64",
    );

    let response: Response;
    try {
      response = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/json",
          ...(idempotencyKey
            ? { "X-Razorpay-Idempotency-Key": idempotencyKey }
            : {}),
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (cause) {
      // Network failure or timeout — never surfaced with the request body
      // attached, since that would put payment details into the logs.
      this.logger.error(
        `Razorpay ${path} request failed: ${(cause as Error).message}`,
      );
      throw new InternalServerErrorException("PAYMENT_GATEWAY_UNREACHABLE");
    }

    const text = await response.text();

    if (!response.ok) {
      const description = this.describeError(text);
      // Logged, not returned: Razorpay's messages can name internal reasons
      // we don't want echoed to a browser.
      this.logger.error(
        `Razorpay ${path} returned ${response.status}: ${description}`,
      );
      throw new InternalServerErrorException("PAYMENT_GATEWAY_ERROR");
    }

    return JSON.parse(text) as T;
  }

  private describeError(text: string): string {
    try {
      const parsed = JSON.parse(text) as RazorpayErrorBody;
      return parsed.error?.description ?? text;
    } catch {
      return text;
    }
  }
}
