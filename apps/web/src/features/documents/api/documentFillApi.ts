import { apiClient } from "@/shared/lib/apiClient";

import type { FilledData } from "../components/DynamicTemplateForm";

/** Mirrors FillReply in apps/api/src/modules/ai/document-fill. */
export interface FillReply {
  reply: string;
  answers: FilledData;
  missing: { key: string; label: string }[];
  unclear: { key: string; label: string }[];
  complete: boolean;
}

export interface FillTurn {
  role: "user" | "assistant";
  content: string;
}

/** Mirrors FILL_LIMITS in the API's fill DTO. */
export const FILL_LIMITS = { maxTurns: 40, maxTurnLength: 2000 } as const;

export const documentFillApi = {
  turn: (templateId: string, turns: FillTurn[], answers: FilledData) =>
    apiClient.post<FillReply>(`/ai/documents/${templateId}/fill`, {
      // The newest turns only: the answers carry what the early ones said.
      messages: turns.slice(-FILL_LIMITS.maxTurns),
      answers,
    }),
};
