import { createHmac } from "node:crypto";

import { InternalServerErrorException } from "@nestjs/common";

import { RazorpayService } from "./razorpay.service";

/**
 * The signature check is the whole trust boundary for payments — anything that
 * gets past it is treated as a confirmed capture — so its failure modes matter
 * more than its happy path.
 */
describe("RazorpayService", () => {
  const WEBHOOK_SECRET = "whsec-test";
  const originalEnv = process.env;

  // Env is read in field initialisers, so it has to be set before construction.
  const build = (env: Record<string, string> = {}) => {
    process.env = {
      ...originalEnv,
      RAZORPAY_KEY_ID: "rzp_test_key",
      RAZORPAY_KEY_SECRET: "secret",
      RAZORPAY_WEBHOOK_SECRET: WEBHOOK_SECRET,
      ...env,
    };
    return new RazorpayService();
  };

  const sign = (body: string, secret = WEBHOOK_SECRET) =>
    createHmac("sha256", secret).update(body).digest("hex");

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  describe("verifyWebhookSignature", () => {
    it("accepts a body signed with the configured secret", () => {
      const service = build();
      const body = '{"event":"payment.captured"}';

      expect(service.verifyWebhookSignature(body, sign(body))).toBe(true);
    });

    it("rejects a body signed with a different secret", () => {
      const service = build();
      const body = '{"event":"payment.captured"}';

      expect(
        service.verifyWebhookSignature(body, sign(body, "wrong-secret")),
      ).toBe(false);
    });

    // A single altered byte must invalidate the whole signature, otherwise an
    // attacker could rewrite the amount on a legitimately signed event.
    it("rejects a body modified after signing", () => {
      const service = build();
      const body = '{"event":"payment.captured"}';
      const signature = sign(body);

      expect(
        service.verifyWebhookSignature('{"event":"payment.failed"}', signature),
      ).toBe(false);
    });

    it("rejects an empty signature header", () => {
      const service = build();

      expect(service.verifyWebhookSignature("{}", "")).toBe(false);
    });

    /**
     * The dangerous case: with no secret configured, HMAC("") still produces a
     * valid-looking digest that an attacker can compute themselves. A deploy
     * missing the env var must reject everything rather than accept forgeries.
     */
    it("fails closed when no webhook secret is configured", () => {
      const service = build({ RAZORPAY_WEBHOOK_SECRET: "" });
      const body = '{"event":"payment.captured"}';
      const forged = createHmac("sha256", "").update(body).digest("hex");

      expect(service.verifyWebhookSignature(body, forged)).toBe(false);
    });
  });

  describe("createOrder", () => {
    const okResponse = (payload: unknown) =>
      jest
        .spyOn(globalThis, "fetch")
        .mockResolvedValue(
          new Response(JSON.stringify(payload), { status: 200 }),
        );

    it("posts the gross amount in paise with Basic auth", async () => {
      const fetchSpy = okResponse({ id: "order_123" });
      const service = build();

      const result = await service.createOrder(23482, "ord-1");

      expect(result).toEqual({ id: "order_123" });
      const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("https://api.razorpay.com/v1/orders");
      expect(JSON.parse(init.body as string)).toEqual({
        amount: 23482,
        currency: "INR",
        receipt: "ord-1",
      });
      const headers = init.headers as Record<string, string>;
      expect(headers.Authorization).toBe(
        `Basic ${Buffer.from("rzp_test_key:secret").toString("base64")}`,
      );
    });

    // Razorpay rejects the whole request if receipt exceeds 40 characters,
    // which would take down checkout for every order if an id ever grew.
    it("truncates an over-long receipt instead of letting Razorpay reject it", async () => {
      const fetchSpy = okResponse({ id: "order_123" });
      const service = build();

      await service.createOrder(100, "x".repeat(60));

      const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(init.body as string) as { receipt: string };
      expect(body.receipt).toHaveLength(40);
    });

    it("throws without configured keys rather than calling out with empty credentials", async () => {
      const fetchSpy = okResponse({ id: "order_123" });
      const service = build({ RAZORPAY_KEY_SECRET: "" });

      await expect(service.createOrder(100, "ord-1")).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    // Razorpay's error descriptions can name internal decline reasons; they
    // belong in the log, not in a response body a customer can read.
    it("does not surface Razorpay's error text to the caller", async () => {
      jest.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(
          JSON.stringify({
            error: { description: "internal gateway detail" },
          }),
          { status: 400 },
        ),
      );
      const service = build();

      await expect(service.createOrder(100, "ord-1")).rejects.toThrow(
        "PAYMENT_GATEWAY_ERROR",
      );
    });

    it("converts a network failure into a gateway error", async () => {
      jest
        .spyOn(globalThis, "fetch")
        .mockRejectedValue(new Error("ECONNREFUSED"));
      const service = build();

      await expect(service.createOrder(100, "ord-1")).rejects.toThrow(
        "PAYMENT_GATEWAY_UNREACHABLE",
      );
    });
  });

  describe("refund", () => {
    /**
     * Without this header a retry after a failed database write would move
     * money a second time.
     */
    it("sends the idempotency key so a retry cannot double-refund", async () => {
      const fetchSpy = jest
        .spyOn(globalThis, "fetch")
        .mockResolvedValue(
          new Response(JSON.stringify({ id: "rfnd_1" }), { status: 200 }),
        );
      const service = build();

      await service.refund("pay_abc", 23482, "ord-1");

      const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("https://api.razorpay.com/v1/payments/pay_abc/refund");
      expect(
        (init.headers as Record<string, string>)["X-Razorpay-Idempotency-Key"],
      ).toBe("ord-1");
      expect(JSON.parse(init.body as string)).toEqual({ amount: 23482 });
    });
  });
});
