import { fetch } from "expo/fetch";

import { api, APP_CLIENT_HEADERS } from "@/lib/api";
import { API_URL } from "@/lib/config";
import { getAccessToken } from "@/lib/session";

// The website's assistantApi (apps/web/src/features/assistant/api). React
// Native's own fetch can't read a response as it streams; expo/fetch can,
// so answers appear word by word here too.

/** Mirrors ChatReply in apps/api/src/modules/ai/chat/chat.service.ts. */
export interface ChatSource {
  sourceType: "template" | "course" | "content" | "faq";
  sourceId: string;
  title: string;
  /** A website path. */
  href: string;
  /** Before GST. */
  priceInPaise: number;
  kind: string;
}

export interface ChatReply {
  answer: string;
  sources: ChatSource[];
  suggestDraft: boolean;
}

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

export type ChatFailure = "not-configured" | "busy" | "too-fast" | "failed";

export class ChatError extends Error {
  constructor(readonly reason: ChatFailure) {
    super(reason);
  }
}

export function classifyChatError(status: number, body: string): ChatFailure {
  if (status === 429) return "too-fast";
  if (status === 503)
    return body.includes("AI_NOT_CONFIGURED") ? "not-configured" : "busy";
  return "failed";
}

/** Reads "data: {json}" blocks separated by blank lines. */
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

/** The [n] citation and [draft] markers are for the screen, not the reader. */
export function cleanAnswer(text: string): string {
  return text
    .replace(/\s?\[(\d{1,2}|draft)\]/gi, "")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

export const assistantApi = {
  status: () => api.get<{ assistant: boolean }>("/ai/status"),

  /**
   * Asks, handing each piece of the answer to `onEvent` as it arrives. A
   * failure before the first word throws a ChatError; one after it arrives
   * as an "error" event.
   */
  stream: async (
    turns: ChatTurn[],
    onEvent: (event: ChatStreamEvent) => void,
    signal?: AbortSignal,
    conversationId?: string,
  ): Promise<void> => {
    const token = getAccessToken();
    let res: Awaited<ReturnType<typeof fetch>>;
    try {
      res = await fetch(`${API_URL}/ai/chat/stream`, {
        method: "POST",
        signal,
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
          ...APP_CLIENT_HEADERS,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          messages: turns.slice(-CHAT_LIMITS.maxTurns),
          conversationId,
        }),
      });
    } catch {
      if (signal?.aborted) return;
      throw new ChatError("failed");
    }
    if (!res.ok || !res.body) {
      throw new ChatError(classifyChatError(res.status, await res.text()));
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
};
