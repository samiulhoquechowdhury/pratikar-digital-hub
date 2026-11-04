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

/**
 * An Indian mobile number in the one form every account is stored under:
 * "+91" and ten digits starting 6–9. Accepts what people type — spaces,
 * dashes, a leading 0, 91 or +91 — and returns null for anything else.
 *
 * Shared by the website, the app and the API so "98765 43210" and
 * "+91-9876543210" are always the same account.
 */
export function normalizeIndianMobile(input: string): string | null {
  let digits = input.replace(/[^\d]/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith("0"))
    digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits) ? `+91${digits}` : null;
}

/** "+919876543210" -> "+91 98765 43210", for showing a number back. */
export function formatIndianMobile(e164: string): string {
  const digits = e164.replace(/^\+91/, "");
  return digits.length === 10
    ? `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`
    : e164;
}
