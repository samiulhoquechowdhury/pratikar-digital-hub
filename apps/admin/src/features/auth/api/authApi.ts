import type {
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

  // Refreshing lives in shared/lib/apiClient (refreshSession), beside the
  // requests that need it when the access token expires.

  /**
   * Revokes the session row server-side. Without this, "sign out" would only
   * clear the tab: the refresh cookie would survive and the next reload would
   * quietly sign the same person back in.
   */
  logout: () => apiClient.post<void>("/auth/logout", { allDevices: false }),
};
