import Anthropic from "@anthropic-ai/sdk";
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from "@nestjs/common";

import { toServiceError } from "../anthropic-errors";
import {
  KnowledgeBaseSearch,
  type KnowledgeHit,
} from "../knowledge-base/knowledge-base-search.service";
import { VoyageRateLimitedError } from "../knowledge-base/voyage-embedder.service";
import { servedText } from "../served-text";

import { ANTHROPIC_CLIENT } from "./anthropic.provider";
import { AssistantLog } from "./assistant-log.service";
import { SYSTEM_PROMPT, catalogueBlock, citedHits } from "./chat.prompt";
import type { ChatTurnDto } from "./dto/chat.dto";

/** The current Opus, per Anthropic's guidance; overridable without a deploy. */
const DEFAULT_MODEL = "claude-opus-5-5";

/**
 * A ceiling, not a target: answers are a few sentences. Set well below the
 * usual default because the endpoint is public — it caps what one request
 * can cost if someone asks for an essay.
 */
const MAX_TOKENS = 4096;

/** Who is asking, for the assistant log. Both optional: the chat is public. */
export interface ChatContext {
  /** The browser's id for this chat; nothing is logged without one. */
  conversationId?: string;
  /** Set when the visitor is signed in. */
  userId?: string | null;
}

export interface ChatSource {
  sourceType: KnowledgeHit["sourceType"];
  sourceId: string;
  title: string;
  href: string;
  priceInPaise: number;
  /** "Course", "E-book", "Legal form", "Document template"… */
  kind: string;
}

export interface ChatReply {
  answer: string;
  sources: ChatSource[];
  /** The model offered the custom-drafting service; the site shows its button. */
  suggestDraft: boolean;
}

/** What the stream sends the browser, one event at a time. */
export type ChatStreamEvent =
  /** More of the answer. */
  | { type: "delta"; text: string }
  /**
   * Throw away what has been shown: the model declined partway and a
   * fallback model is starting over (or the answer became a refusal).
   */
  | { type: "reset" }
  /** The finished answer, cleaned, with its sources. Replaces the deltas. */
  | ({ type: "done" } & ChatReply)
  /** It failed after streaming had begun; `reason` as for an HTTP error. */
  | { type: "error"; reason: "AI_BUSY" | "AI_ERROR" };

/** Said when the model declines. Not an error to the customer — just a no. */
const REFUSAL_ANSWER =
  "I can't help with that one. I can help you find a document, a form, an e-book or a course on this site — try describing what you need.";

const EMPTY_ANSWER =
  "Sorry — I couldn't put an answer together for that. Could you try asking another way?";

/** How many catalogue matches the model chooses from. */
const HITS_PER_QUESTION = 8;

/** The marker the model ends an answer with to offer a custom draft. */
const DRAFT_MARKER = /\s*\[draft\]\s*/gi;

/**
 * A follow-up this short ("how much is it?", "in Hindi?") says little on its
 * own, so the search also reads the question before it.
 */
const FOLLOW_UP_CHARS = 60;

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  readonly model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;

  constructor(
    @Inject(ANTHROPIC_CLIENT) private readonly client: Anthropic | null,
    private readonly search: KnowledgeBaseSearch,
    private readonly log: AssistantLog,
  ) {}

  get isConfigured(): boolean {
    return this.client !== null && this.search.isConfigured;
  }

  /**
   * Answers the last turn of a conversation, grounded in the catalogue, in
   * one response. The site streams instead (streamAnswer); this stays for
   * callers that want the whole answer at once.
   */
  async answer(
    turns: ChatTurnDto[],
    context: ChatContext = {},
  ): Promise<ChatReply> {
    const { client, hits, params } = await this.prepare(turns);

    let response: Anthropic.Beta.BetaMessage;
    try {
      response = await client.beta.messages.create(params);
    } catch (error) {
      throw toServiceError(error, this.logger);
    }
    return this.finish(response, hits, turns, context);
  }

  /**
   * The same answer, streamed: `emit` receives the text as it's written,
   * then the finished reply. Anything wrong before the first word — no
   * key, bad input, search down — is thrown, so the caller can still answer
   * with an HTTP error; after that, failures arrive as an "error" event.
   */
  async streamAnswer(
    turns: ChatTurnDto[],
    emit: (event: ChatStreamEvent) => void,
    signal?: AbortSignal,
    context: ChatContext = {},
  ): Promise<void> {
    const { client, hits, params } = await this.prepare(turns);

    let response: Anthropic.Beta.BetaMessage;
    try {
      const stream = client.beta.messages.stream(params, { signal });
      stream.on("streamEvent", (event) => {
        if (
          event.type === "content_block_start" &&
          event.content_block.type === "fallback"
        ) {
          emit({ type: "reset" });
        } else if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta"
        ) {
          emit({ type: "delta", text: event.delta.text });
        }
      });
      response = await stream.finalMessage();
    } catch (error) {
      if (signal?.aborted) return;
      const failure = toServiceError(error, this.logger);
      emit({
        type: "error",
        reason:
          failure instanceof ServiceUnavailableException
            ? "AI_BUSY"
            : "AI_ERROR",
      });
      return;
    }

    const reply = this.finish(response, hits, turns, context);
    if (response.stop_reason === "refusal") emit({ type: "reset" });
    emit({ type: "done", ...reply });
  }

  /** Checks the request, searches the catalogue and builds the model request. */
  private async prepare(turns: ChatTurnDto[]) {
    const client = this.client;
    if (!client || !this.search.isConfigured) {
      throw new ServiceUnavailableException("AI_NOT_CONFIGURED");
    }

    const question = turns.at(-1)!;
    if (question.role !== "user") {
      throw new BadRequestException("LAST_TURN_MUST_BE_USER");
    }

    let hits: KnowledgeHit[];
    try {
      hits = await this.search.search(searchQuery(turns), HITS_PER_QUESTION);
    } catch (error) {
      if (error instanceof VoyageRateLimitedError) {
        throw new ServiceUnavailableException("AI_BUSY");
      }
      throw error;
    }

    const params = {
      model: this.model,
      max_tokens: MAX_TOKENS,
      // Anthropic's server-side fallback: if the model declines on policy
      // grounds, the same request is re-run on a model the API picks for
      // that kind of refusal, inside this one call.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default" as const,
      // Chat, not analysis: low effort keeps answers quick and cheap, and
      // matching a question to a catalogue doesn't reward deeper thought.
      output_config: { effort: "low" as const },
      system: [
        {
          type: "text" as const,
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" as const },
        },
      ],
      messages: [
        ...historyOf(turns.slice(0, -1)),
        {
          role: "user" as const,
          content: `${catalogueBlock(hits)}\n\n${question.content}`,
        },
      ],
    } satisfies Anthropic.Beta.MessageCreateParamsNonStreaming;

    return { client, hits, params };
  }

  /** The finished response as the reply the browser renders. */
  private finish(
    response: Anthropic.Beta.BetaMessage,
    hits: KnowledgeHit[],
    turns: ChatTurnDto[],
    context: ChatContext,
  ): ChatReply {
    this.logger.log(
      `Answered with ${response.model}: ${response.usage.input_tokens} in, ${response.usage.output_tokens} out, ${hits.length} hits`,
    );

    const refused = response.stop_reason === "refusal";
    let reply: ChatReply;
    if (refused) {
      reply = { answer: REFUSAL_ANSWER, sources: [], suggestDraft: false };
    } else {
      const raw = servedText(response.content).trim();
      const answer = raw.replace(DRAFT_MARKER, " ").trim();
      reply = {
        answer: answer || EMPTY_ANSWER,
        suggestDraft: /\[draft\]/i.test(raw),
        sources: citedHits(answer, hits).map((hit) => ({
          sourceType: hit.sourceType,
          sourceId: hit.sourceId,
          title: hit.title,
          href: hit.href,
          priceInPaise: hit.priceInPaise,
          kind: hit.kind,
        })),
      };
    }

    // Kept only when the browser names the conversation; never awaited —
    // the customer's answer doesn't wait on the log.
    if (context.conversationId) {
      void this.log.record({
        conversationId: context.conversationId,
        userId: context.userId ?? null,
        question: turns.at(-1)!.content,
        answer: reply.answer,
        hitCount: hits.length,
        cited: reply.sources.map((source) => source.title),
        suggestedDraft: reply.suggestDraft,
        refused,
        model: response.model,
      });
    }
    return reply;
  }
}

/**
 * What to search the catalogue for: the new question, and — when it is a
 * short follow-up — the customer's question before it, so "how much is
 * it?" still finds the rent agreement.
 */
export function searchQuery(turns: ChatTurnDto[]): string {
  const question = turns.at(-1)!.content;
  if (question.length >= FOLLOW_UP_CHARS) return question;
  const earlier = turns
    .slice(0, -1)
    .reverse()
    .find((turn) => turn.role === "user");
  return earlier ? `${earlier.content}\n${question}` : question;
}

/**
 * Earlier turns as the API wants them. A conversation must open with the
 * customer, so a leading assistant greeting from the browser is dropped.
 */
function historyOf(turns: ChatTurnDto[]): Anthropic.Beta.BetaMessageParam[] {
  const firstUser = turns.findIndex((turn) => turn.role === "user");
  if (firstUser === -1) return [];
  return turns
    .slice(firstUser)
    .map((turn) => ({ role: turn.role, content: turn.content }));
}
