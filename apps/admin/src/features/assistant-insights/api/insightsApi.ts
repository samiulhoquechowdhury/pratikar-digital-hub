import { apiClient } from "@/shared/lib/apiClient";

/** GET /ai/insights — see AssistantLog.insights in the API. */
export interface AssistantInsights {
  period: { days: number; since: string };
  questions: number;
  conversations: number;
  /** Questions where nothing was recommended, or a custom draft was offered. */
  unmatched: number;
  draftOffers: number;
  signedIn: number;
  /** The unmatched questions themselves, newest first. */
  gaps: {
    id: string;
    question: string;
    suggestedDraft: boolean;
    createdAt: string;
  }[];
}

export interface ConversationTurn {
  question: string;
  answer: string;
  cited: string[];
  citedCount: number;
  suggestedDraft: boolean;
  refused: boolean;
  createdAt: string;
}

export interface AssistantConversation {
  conversationId: string;
  signedIn: boolean;
  startedAt: string | null;
  turns: ConversationTurn[];
}

export const insightsApi = {
  insights: (days: number) =>
    apiClient.get<AssistantInsights>(`/ai/insights?days=${days}`),
  conversations: () =>
    apiClient.get<AssistantConversation[]>("/ai/insights/conversations"),
};
