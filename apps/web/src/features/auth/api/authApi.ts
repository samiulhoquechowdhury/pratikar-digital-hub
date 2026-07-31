import type {
  AuthSession,
  GoogleSignInPayload,
  OtpRequestPayload,
  OtpVerifyPayload,
} from "@pratikar/types";

import { apiClient } from "@/shared/lib/apiClient";

// Thin wrappers around the endpoints spec'd in docs/srs.md Section 3.1 and the
// verify-flow discussion: POST /auth/otp/request, POST /auth/otp/verify.
export const authApi = {
  requestOtp: (payload: OtpRequestPayload) =>
    apiClient.post<void>("/auth/otp/request", payload),

  verifyOtp: (payload: OtpVerifyPayload) =>
    apiClient.post<AuthSession>("/auth/otp/verify", payload),

  // The API re-verifies the token with Google, so this is a sign-in, not a
  // claim we're taking on trust from the browser.
  signInWithGoogle: (payload: GoogleSignInPayload) =>
    apiClient.post<AuthSession>("/auth/google", payload),

  refresh: () => apiClient.post<{ accessToken: string }>("/auth/refresh"),

  logout: (allDevices = false) =>
    apiClient.post<void>("/auth/logout", { allDevices }),
};
