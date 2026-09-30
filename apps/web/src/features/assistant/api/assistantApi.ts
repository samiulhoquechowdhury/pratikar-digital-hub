import { apiClient } from "@/shared/lib/apiClient";

/** Mirrors ChatReply in apps/api/src/modules/ai/chat/chat.service.ts. */
export interface ChatSource {
  sourceType: "template" | "course" | "content";
  sourceId: string;
  title: string;
  href: string;
  /** Before GST. */
  priceInPaise: number;
}

export interface ChatReply {
  answer: string;
  sources: ChatSource[];
}

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

/** Mirrors CHAT_LIMITS in the API's chat DTO. */
export const CHAT_LIMITS = { maxTurnLength: 2000, maxTurns: 12 } as const;

/**
 * Why a question didn't get a live answer — each one is handled differently:
 *
 *   not-configured  no model key on the server; fall back to the scripted
 *                   preview for the rest of the visit
 *   busy            the model or the search is overloaded; try again shortly
 *   too-fast        this visitor hit the per-minute limit
 *   failed          anything else
 */
export type ChatFailure = "not-configured" | "busy" | "too-fast" | "failed";

export class ChatError extends Error {
  constructor(readonly reason: ChatFailure) {
    super(reason);
  }
}

/** apiClient throws `API error <status>: <body>`; this reads it back. */
export function classifyChatError(error: unknown): ChatFailure {
  const match = /^API error (\d{3}): ([\s\S]*)$/.exec(
    error instanceof Error ? error.message : "",
  );
  if (!match) return "failed";
  const [, status, body] = match;
  if (status === "429") return "too-fast";
  if (status === "503") {
    return body!.includes("AI_NOT_CONFIGURED") ? "not-configured" : "busy";
  }
  return "failed";
}

export const assistantApi = {
  ask: async (turns: ChatTurn[]): Promise<ChatReply> => {
    try {
      return await apiClient.post<ChatReply>("/ai/chat", {
        // The newest turns only: the API accepts a bounded history, and a
        // long conversation's early turns matter least to the next answer.
        messages: turns.slice(-CHAT_LIMITS.maxTurns),
      });
    } catch (error) {
      throw new ChatError(classifyChatError(error));
    }
  },
};
