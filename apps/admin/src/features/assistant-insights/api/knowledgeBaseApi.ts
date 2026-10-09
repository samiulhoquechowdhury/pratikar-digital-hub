import { apiClient } from "@/shared/lib/apiClient";

/** GET /ai/knowledge-base/status. */
export interface IndexStatus {
  configured: boolean;
  model: string;
  sources: {
    type: string;
    label: string;
    published: number;
    indexed: number;
  }[];
  /** Jobs still to run — a rebuild in progress. */
  pending: number;
  failed: number;
  lastUpdated: string | null;
}

export const knowledgeBaseApi = {
  status: () => apiClient.get<IndexStatus>("/ai/knowledge-base/status"),
  rebuild: () =>
    apiClient.post<{ queued: number }>("/ai/knowledge-base/reindex"),
};
