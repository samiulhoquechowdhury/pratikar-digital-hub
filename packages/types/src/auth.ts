import type { Role } from "./roles";

export type OtpChannel = "email" | "sms";

export interface OtpRequestPayload {
  identifier: string; // email address or E.164 phone number
  channel: OtpChannel;
}

export interface OtpVerifyPayload {
  identifier: string;
  channel: OtpChannel;
  otp: string;
}

export interface AuthenticatedUser {
  id: string;
  name: string | null;
  role: Role;
}

/**
 * What every successful sign-in returns, whichever way you got there. OTP and
 * Google deliberately produce the same shape — the front end stores a session
 * without needing to know which door it came through.
 */
export interface AuthSession {
  accessToken: string;
  user: AuthenticatedUser;
  /** True the first time an identifier is seen — the UI greets rather than welcomes back. */
  isNewUser: boolean;
  // refreshToken is omitted here on purpose for the web flow (httpOnly cookie);
  // the API includes it in the raw JSON body only for the Android client.
}

/** @deprecated Use AuthSession — kept so existing imports keep resolving. */
export type OtpVerifyResponse = AuthSession;

export interface GoogleSignInPayload {
  /**
   * The `credential` field from Google Identity Services: a JWT signed by
   * Google that names our client id as its audience. Not a secret in the
   * usual sense — it is single-purpose and short-lived — but it is a bearer
   * credential, so it only ever travels to our own API.
   */
  idToken: string;
}
