import type {
  GoogleSignInPayload,
  OtpRequestPayload,
  OtpVerifyPayload,
} from "@pratikar/types";

import { api } from "@/lib/api";
import type { AppSession } from "@/providers/AuthProvider";

// The same endpoints as the website (docs/srs.md Section 3.1). Every request
// carries the app header, so sign-ins come back with the refresh token.
export const authApi = {
  requestOtp: (payload: OtpRequestPayload) =>
    api.post<void>("/auth/otp/request", payload),

  verifyOtp: (payload: OtpVerifyPayload) =>
    api.post<AppSession>("/auth/otp/verify", payload),

  signInWithGoogle: (payload: GoogleSignInPayload) =>
    api.post<AppSession>("/auth/google", payload),
};
