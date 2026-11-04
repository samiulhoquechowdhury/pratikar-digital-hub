import type {
  CouponQuote,
  CustomerOrder,
  OrderInvoice,
  OrderItemType,
} from "@pratikar/types";

import { api } from "@/lib/api";

/** What POST /orders returns: our order, with the Razorpay order attached. */
export interface CreatedOrder {
  id: string;
  itemType: OrderItemType;
  amount: number;
  gstAmount: number;
  status: string;
  razorpayOrderId: string;
}

// The website's paymentsApi, unchanged: the app pays for the same orders.
export const paymentsApi = {
  createOrder: (itemType: OrderItemType, itemId: string, couponCode?: string) =>
    api.post<CreatedOrder>("/orders", {
      itemType,
      itemId,
      ...(couponCode ? { couponCode } : {}),
    }),

  quote: (code: string, itemType: OrderItemType, itemId: string) =>
    api.post<CouponQuote>("/orders/quote", { code, itemType, itemId }),

  listMine: () => api.get<CustomerOrder[]>("/orders/mine"),

  /** Asks the server to check with Razorpay — for a slow webhook. */
  confirm: (orderId: string) =>
    api.post<{ id: string; status: string }>(`/orders/${orderId}/confirm`, {}),

  /** Fetched on tap: the signed URL inside is short-lived. */
  getInvoice: (orderId: string) =>
    api.get<OrderInvoice>(`/orders/${orderId}/invoice`),
};
