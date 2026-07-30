import { createHmac, timingSafeEqual } from "node:crypto";

import { Injectable } from "@nestjs/common";

// Thin wrapper around Razorpay's HTTP API. Kept as a separate service (rather
// than inline in PaymentsService) so it's the one place that changes if we
// ever swap payment providers — nothing else should import the Razorpay SDK
// directly.
@Injectable()
export class RazorpayService {
  private readonly keyId = process.env.RAZORPAY_KEY_ID ?? "";
  private readonly keySecret = process.env.RAZORPAY_KEY_SECRET ?? "";
  private readonly webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET ?? "";

  // Stub: the real implementation awaits the Razorpay HTTP call. Kept async now
  // so callers don't have to change when it lands.
  // eslint-disable-next-line @typescript-eslint/require-await
  async createOrder(
    amountInPaise: number,
    receipt: string,
  ): Promise<{ id: string }> {
    // TODO: POST https://api.razorpay.com/v1/orders with Basic auth
    // (keyId:keySecret), body { amount: amountInPaise, currency: "INR", receipt }.
    throw new Error(
      `Not implemented — Razorpay order creation for receipt ${receipt}`,
    );
  }

  /**
   * Verifies X-Razorpay-Signature against the raw webhook body — docs/trd.md
   * Section 4.4: never trust a client-reported payment status, only this.
   */
  verifyWebhookSignature(rawBody: string, signatureHeader: string): boolean {
    const expected = createHmac("sha256", this.webhookSecret)
      .update(rawBody)
      .digest("hex");
    const expectedBuf = Buffer.from(expected);
    const actualBuf = Buffer.from(signatureHeader);
    if (expectedBuf.length !== actualBuf.length) return false;
    return timingSafeEqual(expectedBuf, actualBuf);
  }

  // eslint-disable-next-line @typescript-eslint/require-await -- stub; see createOrder.
  async refund(
    razorpayPaymentId: string,
    amountInPaise: number,
  ): Promise<{ id: string }> {
    // TODO: POST https://api.razorpay.com/v1/payments/{id}/refund
    throw new Error(
      `Not implemented — refund for payment ${razorpayPaymentId} (${amountInPaise})`,
    );
  }
}
