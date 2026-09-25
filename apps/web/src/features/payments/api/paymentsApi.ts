import type {
  CustomerOrder,
  OrderInvoice,
  OrderItemType,
} from "@pratikar/types";

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

  /**
   * The GST invoice for one order. Fetched on click rather than with the
   * list: the download URL it carries is signed and short-lived, so one
   * minted while the page loaded would be stale by the time it was used.
   */
  getInvoice: (orderId: string) =>
    apiClient.get<OrderInvoice>(`/orders/${orderId}/invoice`),
};
