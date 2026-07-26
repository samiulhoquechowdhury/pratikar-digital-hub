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

export interface OtpVerifyResponse {
  accessToken: string;
  user: AuthenticatedUser;
  isNewUser: boolean;
  // refreshToken is omitted here on purpose for the web flow (httpOnly cookie);
  // the API includes it in the raw JSON body only for the Android client.
}
