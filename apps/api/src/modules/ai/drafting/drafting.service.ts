import Anthropic from "@anthropic-ai/sdk";
import { Inject, Injectable, Logger } from "@nestjs/common";

import { ANTHROPIC_CLIENT } from "../chat/anthropic.provider";
import { servedText } from "../served-text";

import {
  DRAFT_OUTPUT_SCHEMA,
  DRAFT_SYSTEM_PROMPT,
  briefBlock,
  parseDraft,
  precedentsBlock,
  type DocumentDraft,
  type DraftBrief,
  type Precedent,
} from "./draft-prompt";

/** Same model as the rest of the AI features; overridable without a deploy. */
const DEFAULT_MODEL = "claude-opus-5-5";

/**
 * Room for a long agreement and its JSON wrapping. Streamed (see below), so a
 * high ceiling costs nothing unless it's used.
 */
const MAX_TOKENS = 32_000;

/** A long agreement at medium effort can take minutes; the client's default is one. */
const REQUEST_TIMEOUT_MS = 10 * 60_000;

/** Why a draft didn't come back — each is handled differently by the worker. */
export type DraftFailure =
  /** Temporary: overloaded, rate limited, network. Worth retrying. */
  | "busy"
  /** Not ours to retry: refused, cut off, or unreadable. */
  | "unusable";

export class DraftingError extends Error {
  constructor(
    readonly reason: DraftFailure,
    message: string,
  ) {
    super(message);
  }
}

/**
 * Writes a custom legal document from a customer's description, or revises
 * one already written. Runs inside the document-generation worker, never in
 * a request: a full agreement takes the model a minute or more.
 */
@Injectable()
export class DraftingService {
  private readonly logger = new Logger(DraftingService.name);
  readonly model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;

  constructor(
    @Inject(ANTHROPIC_CLIENT) private readonly client: Anthropic | null,
  ) {}

  get isConfigured(): boolean {
    return this.client !== null;
  }

  /**
   * A first draft, or — given the previous draft and what to change — a
   * revision of it. A declined request comes back as a draft with
   * `declined` set, not as an error: it's an answer for the customer.
   */
  async draft(
    brief: DraftBrief,
    revision?: { previous: DocumentDraft; instruction: string },
    precedents: Precedent[] = [],
  ): Promise<DocumentDraft> {
    if (!this.client) {
      throw new DraftingError("unusable", "AI_NOT_CONFIGURED");
    }

    // The precedents first, then the request: the same opening for a first
    // draft and for each revision of it.
    const request = precedents.length
      ? `${precedentsBlock(precedents)}\n\n${briefBlock(brief)}`
      : briefBlock(brief);
    const messages: Anthropic.Beta.BetaMessageParam[] = [
      { role: "user", content: request },
    ];
    if (revision) {
      // The draft as the model wrote it — without the references the worker
      // added, which aren't part of the model's output.
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- named only to be left out
      const { references: _refs, ...previous } = revision.previous;
      messages.push(
        { role: "assistant", content: JSON.stringify(previous) },
        {
          role: "user",
          content: `Revise the draft. The customer asks:\n${revision.instruction}`,
        },
      );
    }

    let response: Anthropic.Beta.BetaMessage;
    try {
      // Streamed for the timeout, not for display: a long non-streaming
      // request is the kind that dies at a proxy halfway through.
      response = await this.client.beta.messages
        .stream(
          {
            model: this.model,
            max_tokens: MAX_TOKENS,
            betas: ["server-side-fallback-2026-07-01"],
            fallbacks: "default",
            // Medium: a whole legal document is worth more thought than a
            // chat answer, and the advocate's time is the expensive part.
            output_config: {
              effort: "medium",
              format: { type: "json_schema", schema: DRAFT_OUTPUT_SCHEMA },
            },
            system: [
              {
                type: "text",
                text: DRAFT_SYSTEM_PROMPT,
                cache_control: { type: "ephemeral" },
              },
            ],
            messages,
          },
          { timeout: REQUEST_TIMEOUT_MS },
        )
        .finalMessage();
    } catch (error) {
      if (
        error instanceof Anthropic.RateLimitError ||
        error instanceof Anthropic.InternalServerError ||
        error instanceof Anthropic.APIConnectionError
      ) {
        throw new DraftingError("busy", (error as Error).message);
      }
      throw new DraftingError(
        "unusable",
        error instanceof Error ? error.message : String(error),
      );
    }

    this.logger.log(
      `Drafted with ${response.model}: ${response.usage.input_tokens} in, ${response.usage.output_tokens} out, stop ${response.stop_reason}`,
    );

    if (response.stop_reason === "refusal") {
      return declined(
        "We can't draft this document. If you think that's a mistake, describe it differently or contact support.",
      );
    }

    // Only the text after the last fallback boundary is the served answer.
    const text = servedText(response.content);
    const draft = parseDraft(text);
    if (!draft) {
      throw new DraftingError(
        "unusable",
        `Unreadable draft (stop ${response.stop_reason}, ${text.length} chars)`,
      );
    }
    return draft;
  }
}

function declined(reason: string): DocumentDraft {
  return {
    title: "Not drafted",
    blocks: [],
    missingDetails: [],
    summary: "",
    declined: reason,
  };
}
