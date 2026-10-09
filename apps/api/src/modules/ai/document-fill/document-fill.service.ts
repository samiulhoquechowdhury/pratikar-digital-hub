import Anthropic from "@anthropic-ai/sdk";
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import type { TemplateField } from "@pratikar/types";

import { PrismaService } from "../../../prisma/prisma.service";
import {
  fieldsOf,
  validateAnswers,
  type CleanAnswers,
} from "../../documents/filled-data";
import { toServiceError } from "../anthropic-errors";
import { ANTHROPIC_CLIENT } from "../chat/anthropic.provider";
import type { ChatTurnDto } from "../chat/dto/chat.dto";

import {
  FILL_SYSTEM_PROMPT,
  fillOutputSchema,
  templateBlock,
} from "./fill-prompt";

/** Same model as the site assistant; see chat.service.ts. */
const DEFAULT_MODEL = "claude-opus-5-5";

/** A reply and a set of answers — small. Capped because the route is paid per call. */
const MAX_TOKENS = 4096;

export interface FillReply {
  /** What to say to the customer next. */
  reply: string;
  /** Every answer recorded so far that passes validation. */
  answers: CleanAnswers;
  /** Required fields still without a valid answer, as label and key. */
  missing: { key: string; label: string }[];
  /** Fields the model returned a value for that failed validation. */
  unclear: { key: string; label: string }[];
  /** True when every required field has a valid answer. Decided here. */
  complete: boolean;
}

@Injectable()
export class DocumentFillService {
  private readonly logger = new Logger(DocumentFillService.name);
  readonly model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;

  constructor(
    @Inject(ANTHROPIC_CLIENT) private readonly client: Anthropic | null,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * One turn of filling a template by conversation.
   *
   * The model proposes; this service disposes. Every value it returns goes
   * through the same validateAnswers that generate() applies, anything that
   * fails is dropped and reported as unclear, and whether the form is
   * complete is worked out here from the validated answers — never taken
   * from the model's say-so.
   */
  async fill(
    templateId: string,
    turns: ChatTurnDto[],
    previous: Record<string, unknown> = {},
  ): Promise<FillReply> {
    if (!this.client) {
      throw new ServiceUnavailableException("AI_NOT_CONFIGURED");
    }
    const latest = turns.at(-1)!;
    if (latest.role !== "user") {
      throw new BadRequestException("LAST_TURN_MUST_BE_USER");
    }

    const template = await this.prisma.template.findFirst({
      where: { id: templateId, status: "PUBLISHED" },
      select: { title: true, fieldSchema: true },
    });
    if (!template) throw new NotFoundException("TEMPLATE_NOT_FOUND");
    const fields = fieldsOf(template.fieldSchema);

    // What the browser sent is re-checked like any other input.
    const carried = validateAnswers(fields, previous).clean;

    const messages: Anthropic.Beta.BetaMessageParam[] = [
      ...historyOf(turns.slice(0, -1)),
      {
        role: "user",
        content: `<current_answers>${JSON.stringify(carried)}</current_answers>\n\n${latest.content}`,
      },
    ];

    let response: Anthropic.Beta.BetaMessage;
    try {
      response = await this.client.beta.messages.create({
        model: this.model,
        max_tokens: MAX_TOKENS,
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        // Medium, not the assistant's low: getting a name, an amount or a
        // date right in a legal document is worth the extra thought.
        output_config: {
          effort: "medium",
          format: { type: "json_schema", schema: fillOutputSchema(fields) },
        },
        system: [
          { type: "text", text: FILL_SYSTEM_PROMPT },
          {
            type: "text",
            text: templateBlock(template.title, fields),
            // Fixed prompt + this template's fields: identical for every turn
            // of every conversation about this template.
            cache_control: { type: "ephemeral" },
          },
        ],
        messages,
      });
    } catch (error) {
      throw toServiceError(error, this.logger);
    }

    this.logger.log(
      `Fill turn with ${response.model}: ${response.usage.input_tokens} in, ${response.usage.output_tokens} out`,
    );

    if (response.stop_reason === "refusal") {
      return summarise(
        fields,
        carried,
        {},
        "I can't help with that. Let's carry on with the document — or fill in the form below instead.",
      );
    }

    const proposed = parseProposal(response);
    if (!proposed) {
      return summarise(
        fields,
        carried,
        {},
        "Sorry, I lost track there. Could you say that again?",
      );
    }

    // The model's non-null values over what was already recorded: a
    // correction replaces an answer, a null never erases one.
    const merged: Record<string, unknown> = { ...carried };
    for (const [key, value] of Object.entries(proposed.answers)) {
      if (value !== null && value !== undefined) merged[key] = value;
    }
    return summarise(fields, merged, proposed.answers, proposed.reply);
  }
}

/** Validates the merged answers and works out what's missing and unclear. */
function summarise(
  fields: TemplateField[],
  merged: Record<string, unknown>,
  proposed: Record<string, unknown>,
  reply: string,
): FillReply {
  const { clean, problems } = validateAnswers(fields, merged);
  const labelled = (key: string) => ({
    key,
    label: fields.find((f) => f.key === key)?.label ?? key,
  });
  const missing = problems
    .filter((p) => p.problem === "missing")
    .map((p) => labelled(p.key));
  // Only what the model proposed this turn and that failed: a bad value the
  // browser carried was already dropped when it was re-checked.
  const unclear = problems
    .filter((p) => p.problem !== "missing" && p.key in proposed)
    .map((p) => labelled(p.key));
  return {
    reply,
    answers: clean,
    missing,
    unclear,
    complete: problems.length === 0,
  };
}

function parseProposal(
  response: Anthropic.Beta.BetaMessage,
): { reply: string; answers: Record<string, unknown> } | null {
  const text = response.content
    .flatMap((block) => (block.type === "text" ? [block.text] : []))
    .join("");
  try {
    const parsed = JSON.parse(text) as {
      reply?: unknown;
      answers?: unknown;
    };
    if (typeof parsed.reply !== "string") return null;
    const answers =
      parsed.answers && typeof parsed.answers === "object"
        ? (parsed.answers as Record<string, unknown>)
        : {};
    return { reply: parsed.reply, answers };
  } catch {
    return null;
  }
}

/** Earlier turns as the API wants them: opening with the customer. */
function historyOf(turns: ChatTurnDto[]): Anthropic.Beta.BetaMessageParam[] {
  const firstUser = turns.findIndex((turn) => turn.role === "user");
  if (firstUser === -1) return [];
  return turns
    .slice(firstUser)
    .map((turn) => ({ role: turn.role, content: turn.content }));
}
