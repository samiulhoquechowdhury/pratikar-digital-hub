import { apiClient } from "@/shared/lib/apiClient";

export interface Faq {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
  published: boolean;
  updatedAt: string;
}

export type FaqInput = Omit<Faq, "id" | "updatedAt">;

export const faqApi = {
  all: () => apiClient.get<Faq[]>("/faq/all"),
  create: (input: FaqInput) => apiClient.post<Faq>("/faq", input),
  update: (id: string, input: FaqInput) =>
    apiClient.put<Faq>(`/faq/${id}`, input),
  remove: (id: string) => apiClient.del<{ deleted: true }>(`/faq/${id}`),
};
