import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { OAuth2Client } from "google-auth-library";

/** What we're willing to believe about a caller after Google has vouched. */
export interface GoogleProfile {
  email: string;
  name: string | null;
}

/**
 * Verifies the ID token that "Sign in with Google" hands the browser.
 *
 * The token is a JWT signed by Google, so verification is entirely local
 * against Google's published keys — there is no code-for-token exchange and no
 * client secret involved. That's why this is safe to drive from the browser:
 * the only thing the front end ever holds is a token that is useless to anyone
 * whose client id doesn't match ours.
 */
@Injectable()
export class GoogleAuthService {
  private readonly logger = new Logger(GoogleAuthService.name);

  /**
   * Comma-separated so the Android client (Milestone 5) can be added without
   * touching this code — Google issues a separate client id per platform and
   * mints the `aud` claim accordingly.
   */
  private readonly audience = (process.env.GOOGLE_CLIENT_ID ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  private readonly client = new OAuth2Client();

  get isConfigured(): boolean {
    return this.audience.length > 0;
  }

  constructor() {
    if (!this.isConfigured) {
      this.logger.warn(
        "GOOGLE_CLIENT_ID not set — POST /auth/google will reject every request. " +
          "OTP sign-in is unaffected.",
      );
    }
  }

  async verify(idToken: string): Promise<GoogleProfile> {
    if (!this.isConfigured) {
      // Refusing outright rather than verifying against an empty audience:
      // google-auth-library treats an empty list as "any audience", which
      // would accept a token minted for somebody else's application.
      this.logger.error(
        "Google sign-in attempted but GOOGLE_CLIENT_ID is not set — rejecting.",
      );
      throw new UnauthorizedException("GOOGLE_SIGN_IN_UNAVAILABLE");
    }

    let payload;
    try {
      // Checks the signature against Google's rotating public keys, the issuer,
      // the expiry, and that `aud` is one of ours. A token minted for a
      // different application fails here.
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: this.audience,
      });
      payload = ticket.getPayload();
    } catch (error) {
      // Google's message can name keys and audiences; log it, don't return it.
      this.logger.warn(
        `Google ID token rejected: ${error instanceof Error ? error.message : "unknown error"}`,
      );
      throw new UnauthorizedException("INVALID_GOOGLE_TOKEN");
    }

    if (!payload?.email) {
      throw new UnauthorizedException("INVALID_GOOGLE_TOKEN");
    }

    /**
     * The check that keeps this from being an account-takeover primitive.
     *
     * We match Google accounts onto existing users by email address, so an
     * unverified email would let anyone who can set a profile field claim
     * someone else's account. Google sets email_verified false for exactly the
     * cases where it hasn't proved ownership, so this is the line that makes
     * the match trustworthy.
     */
    if (!payload.email_verified) {
      throw new UnauthorizedException("GOOGLE_EMAIL_NOT_VERIFIED");
    }

    return {
      email: payload.email.toLowerCase(),
      name: payload.name ?? null,
    };
  }
}
