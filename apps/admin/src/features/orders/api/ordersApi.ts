import { apiClient } from "@/shared/lib/apiClient";

export type OrderStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";
export type OrderItemType =
  "DOCUMENT" | "DOCUMENT_REVIEW" | "CONTENT_ITEM" | "COURSE";

export interface AdminOrder {
  id: string;
  userId: string;
  itemType: OrderItemType;
  amount: number; // paise, excluding GST
  gstAmount: number; // paise
  status: OrderStatus;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
  };
}

export const ordersApi = {
  list: () => apiClient.get<AdminOrder[]>("/orders"),
  refund: (id: string) => apiClient.post<void>(`/orders/${id}/refund`),
};
