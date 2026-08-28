import type {
  AuthenticatedUser,
  OtpRequestPayload,
  OtpVerifyPayload,
  OtpVerifyResponse,
} from "@pratikar/types";

import { apiClient } from "@/shared/lib/apiClient";

export const authApi = {
  requestOtp: (payload: OtpRequestPayload) =>
    apiClient.post<void>("/auth/otp/request", payload),

  verifyOtp: (payload: OtpVerifyPayload) =>
    apiClient.post<OtpVerifyResponse>("/auth/otp/verify", payload),

  /**
   * Exchanges the httpOnly refresh cookie for a fresh access token. The only
   * way back into a session after a reload, since the access token is held in
   * memory and deliberately never persisted.
   */
  refresh: () =>
    apiClient.post<{ accessToken: string; user: AuthenticatedUser }>(
      "/auth/refresh",
    ),

  /**
   * Revokes the session row server-side. Without this, "sign out" would only
   * clear the tab: the refresh cookie would survive and the next reload would
   * quietly sign the same person back in.
   */
  logout: () => apiClient.post<void>("/auth/logout", { allDevices: false }),
};
