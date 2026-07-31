import { ServiceUnavailableException } from "@nestjs/common";

import { NotificationsService } from "./notifications.service";

/** Resend's own error shape, as much of it as this service reads. */
type SendResult = { error: { message: string } | null };

const sendMock = jest.fn<Promise<SendResult>, [unknown]>();

jest.mock("resend", () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: (options: unknown) => sendMock(options) },
  })),
}));

/**
 * This service decides whether a failed email is survivable. Getting the
 * environment check backwards is expensive in both directions: swallow a
 * failure in production and customers wait forever for an OTP that was never
 * sent, with nothing to page on; fail hard in development and only the Resend
 * account owner can ever sign in, because the shared test domain rejects
 * everyone else.
 */
describe("NotificationsService", () => {
  const originalEnv = process.env;

  // Env is read in field initialisers, so it must be set before construction.
  const build = (env: Record<string, string | undefined>) => {
    process.env = { ...originalEnv, ...env };
    for (const [key, value] of Object.entries(env)) {
      if (value === undefined) delete process.env[key];
    }
    return new NotificationsService();
  };

  const warn = jest.spyOn(console, "warn").mockImplementation(() => undefined);

  beforeEach(() => {
    sendMock.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  afterAll(() => warn.mockRestore());

  it("sends through Resend when a key is configured", async () => {
    const service = build({
      RESEND_API_KEY: "re_test",
      RESEND_FROM_EMAIL: "no-reply@pratikar.test",
      NODE_ENV: "development",
    });

    await service.sendEmail("someone@example.com", "Subject", "<p>Body</p>");

    expect(sendMock).toHaveBeenCalledWith({
      from: "no-reply@pratikar.test",
      to: "someone@example.com",
      subject: "Subject",
      html: "<p>Body</p>",
    });
  });

  it("logs instead of sending when no key is configured", async () => {
    const service = build({ RESEND_API_KEY: undefined });

    await expect(
      service.sendEmail("someone@example.com", "S", "<p>B</p>"),
    ).resolves.toBeUndefined();
    expect(sendMock).not.toHaveBeenCalled();
  });

  /**
   * The case that made this change necessary: Resend's test domain rejects
   * every recipient except the account owner, which turned every other login
   * into a 500.
   */
  it("falls back to logging when Resend rejects a recipient outside production", async () => {
    sendMock.mockResolvedValue({ error: { message: "recipient not allowed" } });
    const service = build({
      RESEND_API_KEY: "re_test",
      NODE_ENV: "development",
    });

    await expect(
      service.sendEmail("other@example.com", "S", "<p>code 123456</p>"),
    ).resolves.toBeUndefined();
  });

  /**
   * In production the same failure must surface. Swallowing it would leave a
   * customer waiting for an OTP that never arrives, and nothing would alert.
   */
  it("throws in production when Resend rejects a recipient", async () => {
    sendMock.mockResolvedValue({ error: { message: "recipient not allowed" } });
    const service = build({
      RESEND_API_KEY: "re_test",
      NODE_ENV: "production",
    });

    await expect(
      service.sendEmail("other@example.com", "S", "<p>B</p>"),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  // A 500 tells the UI nothing; this is a known condition the login form can
  // turn into "we couldn't send your code".
  it("reports a delivery failure as a service error, not an internal one", async () => {
    sendMock.mockResolvedValue({ error: { message: "domain not verified" } });
    const service = build({
      RESEND_API_KEY: "re_test",
      NODE_ENV: "production",
    });

    await expect(
      service.sendEmail("other@example.com", "S", "<p>B</p>"),
    ).rejects.toThrow("EMAIL_DELIVERY_FAILED");
  });

  /**
   * Resend's own error text can name the account or the rejected domain, so it
   * belongs in the log rather than in a response a browser can read.
   */
  it("does not leak Resend's error text to the caller", async () => {
    sendMock.mockResolvedValue({
      error: { message: "account acct_12345 is not permitted" },
    });
    const service = build({
      RESEND_API_KEY: "re_test",
      NODE_ENV: "production",
    });

    await expect(
      service.sendEmail("other@example.com", "S", "<p>B</p>"),
    ).rejects.not.toThrow(/acct_12345/);
  });
});
