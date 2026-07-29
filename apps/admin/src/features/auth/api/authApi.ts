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
};
