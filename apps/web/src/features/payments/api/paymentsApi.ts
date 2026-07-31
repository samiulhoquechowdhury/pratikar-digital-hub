import type { CustomerOrder, OrderItemType } from "@pratikar/types";

import { apiClient } from "@/shared/lib/apiClient";

/** What POST /orders returns: our order, with the Razorpay order attached. */
export interface CreatedOrder {
  id: string;
  itemType: OrderItemType;
  amount: number;
  gstAmount: number;
  status: string;
  razorpayOrderId: string;
}

export const paymentsApi = {
  createOrder: (itemType: OrderItemType, itemId: string) =>
    apiClient.post<CreatedOrder>("/orders", { itemType, itemId }),

  listMine: () => apiClient.get<CustomerOrder[]>("/orders/mine"),
};
