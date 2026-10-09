import { apiClient } from "@/shared/lib/apiClient";

export type AnalyticsPeriod = 7 | 30 | 90 | 365;

type ItemType = "DOCUMENT" | "DOCUMENT_REVIEW" | "CONTENT_ITEM" | "COURSE";

/** GET /admin/analytics — every amount in paise, GST included. */
export interface Analytics {
  period: { days: AnalyticsPeriod; from: string; to: string };
  revenue: {
    grossPaise: number;
    gstPaise: number;
    orders: number;
    averageOrderPaise: number;
  };
  refunds: { orders: number; grossPaise: number };
  byType: { itemType: ItemType; orders: number; grossPaise: number }[];
  daily: { day: string; orders: number; grossPaise: number }[];
  documents: { generated: number; paid: number };
  topTemplates: {
    templateId: string;
    title: string;
    generated: number;
    paid: number;
  }[];
  topLibraryItems: {
    id: string | null;
    title: string;
    type: "EBOOK" | "CHECKLIST" | "FORM" | null;
    orders: number;
    grossPaise: number;
  }[];
  newCustomers: number;
  reviewsWaiting: number;
}

export const analyticsApi = {
  overview: (days: AnalyticsPeriod) =>
    apiClient.get<Analytics>(`/admin/analytics?days=${days}`),
};
