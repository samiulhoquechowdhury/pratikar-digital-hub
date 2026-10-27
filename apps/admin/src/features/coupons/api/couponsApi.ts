import type { AdminCoupon, CouponInput } from "@pratikar/types";

import { apiClient } from "@/shared/lib/apiClient";

export const couponsApi = {
  list: () => apiClient.get<AdminCoupon[]>("/coupons"),
  create: (input: CouponInput) =>
    apiClient.post<AdminCoupon>("/coupons", input),
  update: (id: string, input: CouponInput) =>
    apiClient.put<AdminCoupon>(`/coupons/${id}`, input),
};
