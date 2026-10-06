import { apiClient } from "@/shared/lib/apiClient";
import { getAccessToken } from "@/shared/lib/authToken";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/** Mirrors ChatReply in apps/api/src/modules/ai/chat/chat.service.ts. */
export interface ChatSource {
  sourceType: "template" | "course" | "content";
  sourceId: string;
  title: string;
  href: string;
  /** Before GST. */
  priceInPaise: number;
  /** "Course", "E-book", "Legal form", "Document template"… */
  kind: string;
}

export interface ChatReply {
  answer: string;
  sources: ChatSource[];
  /** The assistant offered to draft a custom document. */
  suggestDraft: boolean;
}

/** Mirrors ChatStreamEvent in the API's chat.service.ts. */
export type ChatStreamEvent =
  | { type: "delta"; text: string }
  | { type: "reset" }
  | ({ type: "done" } & ChatReply)
  | { type: "error"; reason: "AI_BUSY" | "AI_ERROR" };

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

/** Mirrors CHAT_LIMITS in the API's chat DTO. */
export const CHAT_LIMITS = { maxTurnLength: 2000, maxTurns: 12 } as const;

/**
 * Why a question didn't get a live answer — each one is handled differently:
 *
 *   not-configured  no model key on the server; the assistant is offline
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

/**
 * Reads a server-sent-events body: "data: {json}" blocks separated by a
 * blank line. Exported for its test; the network is the only other part.
 */
export function parseSseChunk(buffer: string): {
  events: ChatStreamEvent[];
  rest: string;
} {
  const blocks = buffer.split("\n\n");
  const rest = blocks.pop() ?? "";
  const events = blocks.flatMap((block) => {
    const data = block
      .split("\n")
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trim())
      .join("");
    if (!data) return [];
    try {
      return [JSON.parse(data) as ChatStreamEvent];
    } catch {
      return [];
    }
  });
  return { events, rest };
}

export const assistantApi = {
  /** Whether the assistant is live — a key is set on the server. */
  status: () => apiClient.get<{ assistant: boolean }>("/ai/status"),

  /**
   * Asks, and hands each piece of the answer to `onEvent` as it arrives.
   * Resolves when the answer is complete. A failure before the first word
   * throws a ChatError; one after it arrives as an "error" event.
   */
  stream: async (
    turns: ChatTurn[],
    onEvent: (event: ChatStreamEvent) => void,
    signal?: AbortSignal,
  ): Promise<void> => {
    const token = getAccessToken();
    let res: Response;
    try {
      res = await fetch(`${API_BASE_URL}/ai/chat/stream`, {
        method: "POST",
        credentials: "include",
        signal,
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ messages: turns.slice(-CHAT_LIMITS.maxTurns) }),
      });
    } catch {
      if (signal?.aborted) return;
      throw new ChatError("failed");
    }
    if (!res.ok || !res.body) {
      throw new ChatError(
        classifyChatError(
          new Error(`API error ${res.status}: ${await res.text()}`),
        ),
      );
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parsed = parseSseChunk(buffer);
        buffer = parsed.rest;
        parsed.events.forEach(onEvent);
      }
    } catch {
      if (signal?.aborted) return;
      onEvent({ type: "error", reason: "AI_ERROR" });
    }
  },

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
