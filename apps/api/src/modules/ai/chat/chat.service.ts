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

import { ANTHROPIC_CLIENT } from "./anthropic.provider";
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

export interface ChatSource {
  sourceType: KnowledgeHit["sourceType"];
  sourceId: string;
  title: string;
  href: string;
  priceInPaise: number;
}

export interface ChatReply {
  answer: string;
  sources: ChatSource[];
}

/** Said when the model declines. Not an error to the customer — just a no. */
const REFUSAL_ANSWER =
  "I can't help with that one. I can help you find a document template, a course, or a guide on this site — try describing what you need.";

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  readonly model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;

  constructor(
    @Inject(ANTHROPIC_CLIENT) private readonly client: Anthropic | null,
    private readonly search: KnowledgeBaseSearch,
  ) {}

  get isConfigured(): boolean {
    return this.client !== null && this.search.isConfigured;
  }

  /**
   * Answers the last turn of a conversation, grounded in the catalogue.
   *
   * Retrieval runs on the new question only. Earlier turns go to the model as
   * plain history so it can follow "and how much is that one?", but the
   * catalogue it may recommend from is always the one found for this turn —
   * with today's prices.
   */
  async answer(turns: ChatTurnDto[]): Promise<ChatReply> {
    if (!this.client || !this.search.isConfigured) {
      throw new ServiceUnavailableException("AI_NOT_CONFIGURED");
    }

    const question = turns.at(-1)!;
    if (question.role !== "user") {
      throw new BadRequestException("LAST_TURN_MUST_BE_USER");
    }

    let hits: KnowledgeHit[];
    try {
      hits = await this.search.search(question.content);
    } catch (error) {
      if (error instanceof VoyageRateLimitedError) {
        throw new ServiceUnavailableException("AI_BUSY");
      }
      throw error;
    }

    const messages: Anthropic.Beta.BetaMessageParam[] = [
      ...historyOf(turns.slice(0, -1)),
      {
        role: "user",
        content: `${catalogueBlock(hits)}\n\n${question.content}`,
      },
    ];

    let response: Anthropic.Beta.BetaMessage;
    try {
      response = await this.client.beta.messages.create({
        model: this.model,
        max_tokens: MAX_TOKENS,
        // Anthropic's server-side fallback: if the model declines on policy
        // grounds, the same request is re-run on a model the API picks for
        // that kind of refusal, inside this one call.
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        // Chat, not analysis: low effort keeps answers quick and cheap, and
        // matching a question to a catalogue doesn't reward deeper thought.
        output_config: { effort: "low" },
        system: [
          {
            type: "text",
            text: SYSTEM_PROMPT,
            cache_control: { type: "ephemeral" },
          },
        ],
        messages,
      });
    } catch (error) {
      throw toServiceError(error, this.logger);
    }

    this.logger.log(
      `Answered with ${response.model}: ${response.usage.input_tokens} in, ${response.usage.output_tokens} out, ${hits.length} hits`,
    );

    if (response.stop_reason === "refusal") {
      return { answer: REFUSAL_ANSWER, sources: [] };
    }

    const answer = response.content
      .flatMap((block) => (block.type === "text" ? [block.text] : []))
      .join("")
      .trim();

    return {
      answer:
        answer ||
        "Sorry — I couldn't put an answer together for that. Could you try asking another way?",
      sources: citedHits(answer, hits).map((hit) => ({
        sourceType: hit.sourceType,
        sourceId: hit.sourceId,
        title: hit.title,
        href: hit.href,
        priceInPaise: hit.priceInPaise,
      })),
    };
  }
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
