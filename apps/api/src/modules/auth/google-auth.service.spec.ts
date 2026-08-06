import { UnauthorizedException } from "@nestjs/common";

import { GoogleAuthService } from "./google-auth.service";

/** The subset of Google's ID token payload this service reads. */
type Payload = {
  email?: string;
  email_verified?: boolean;
  name?: string;
} | null;

const verifyIdTokenMock = jest.fn<
  Promise<{ getPayload: () => Payload }>,
  [{ idToken: string; audience: string[] }]
>();

jest.mock("google-auth-library", () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: (options: { idToken: string; audience: string[] }) =>
      verifyIdTokenMock(options),
  })),
}));

/**
 * This service is the only thing standing between "anyone with a Google
 * account" and "any account on this site", because sign-in matches Google
 * users onto ours by email address. Each test below is a way that match could
 * be made to point at somebody else's account.
 */
describe("GoogleAuthService", () => {
  const originalEnv = process.env;

  // The audience list is read in a field initialiser, so it has to be set
  // before construction rather than mutated afterwards.
  const build = (clientId: string | null) => {
    process.env = { ...originalEnv };
    if (clientId === null) delete process.env.GOOGLE_CLIENT_ID;
    else process.env.GOOGLE_CLIENT_ID = clientId;
    return new GoogleAuthService();
  };

  const warn = jest.spyOn(console, "warn").mockImplementation(() => undefined);
  const error = jest
    .spyOn(console, "error")
    .mockImplementation(() => undefined);

  beforeEach(() => {
    verifyIdTokenMock.mockResolvedValue({
      getPayload: () => ({
        email: "someone@example.com",
        email_verified: true,
        name: "Someone",
      }),
    });
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  afterAll(() => {
    warn.mockRestore();
    error.mockRestore();
  });

  it("returns the profile for a token Google vouches for", async () => {
    const service = build("client-123.apps.googleusercontent.com");

    await expect(service.verify("token")).resolves.toEqual({
      email: "someone@example.com",
      name: "Someone",
    });
  });

  it("checks the token against our client id", async () => {
    const service = build("client-123.apps.googleusercontent.com");

    await service.verify("token");

    expect(verifyIdTokenMock).toHaveBeenCalledWith({
      idToken: "token",
      audience: ["client-123.apps.googleusercontent.com"],
    });
  });

  // Android gets its own client id from Google, so the same API has to accept
  // tokens minted for more than one audience.
  it("accepts a comma-separated list of client ids", async () => {
    const service = build(" web-client , android-client ");

    await service.verify("token");

    expect(verifyIdTokenMock).toHaveBeenCalledWith({
      idToken: "token",
      audience: ["web-client", "android-client"],
    });
  });

  /**
   * The one that matters most. google-auth-library treats an empty audience
   * as "any audience", so verifying against an unset client id would accept
   * a token minted for somebody else's Google application entirely — and that
   * token names whatever email its issuer chose.
   */
  it("rejects everything when no client id is configured", async () => {
    const service = build(null);

    await expect(service.verify("token")).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(verifyIdTokenMock).not.toHaveBeenCalled();
  });

  /**
   * Google sets email_verified false precisely when it has not proved the
   * address belongs to the signer. Trusting it anyway would let anyone who
   * can type an address into a Workspace profile claim that user's account,
   * along with their purchases and their documents.
   */
  it("rejects an unverified email address", async () => {
    verifyIdTokenMock.mockResolvedValue({
      getPayload: () => ({
        email: "victim@example.com",
        email_verified: false,
        name: "Not really",
      }),
    });
    const service = build("client-123");

    await expect(service.verify("token")).rejects.toThrow(
      "GOOGLE_EMAIL_NOT_VERIFIED",
    );
  });

  it("rejects a token that fails signature verification", async () => {
    verifyIdTokenMock.mockRejectedValue(new Error("Invalid token signature"));
    const service = build("client-123");

    await expect(service.verify("token")).rejects.toThrow(
      "INVALID_GOOGLE_TOKEN",
    );
  });

  it("rejects a token with no email claim", async () => {
    verifyIdTokenMock.mockResolvedValue({ getPayload: () => null });
    const service = build("client-123");

    await expect(service.verify("token")).rejects.toThrow(
      "INVALID_GOOGLE_TOKEN",
    );
  });

  /**
   * Addresses are matched against the `email` column, and Gmail will happily
   * present the same account with different capitalisation. Without this,
   * Someone@example.com and someone@example.com become two accounts holding
   * two halves of one person's purchases.
   */
  it("normalises the email address to lower case", async () => {
    verifyIdTokenMock.mockResolvedValue({
      getPayload: () => ({
        email: "Someone@Example.COM",
        email_verified: true,
      }),
    });
    const service = build("client-123");

    await expect(service.verify("token")).resolves.toEqual({
      email: "someone@example.com",
      name: null,
    });
  });

  // Google's failure text can name keys, audiences and account ids. It belongs
  // in the log, not in a response a browser can read.
  it("does not leak Google's error text to the caller", async () => {
    verifyIdTokenMock.mockRejectedValue(
      new Error("Wrong recipient, payload audience = secret-client-id"),
    );
    const service = build("client-123");

    await expect(service.verify("token")).rejects.not.toThrow(
      /secret-client-id/,
    );
  });
});
