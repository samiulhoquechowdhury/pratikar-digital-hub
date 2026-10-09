import { Injectable, Logger } from "@nestjs/common";

import { PrismaService } from "../../../prisma/prisma.service";

/** How long questions are kept. Stated in the privacy policy — change both. */
export const ASSISTANT_LOG_RETENTION_DAYS = 90;

/** Longest question/answer stored. The DTO caps questions at 2,000 already. */
const MAX_TEXT = 4000;

export interface TurnRecord {
  conversationId: string;
  userId: string | null;
  question: string;
  answer: string;
  hitCount: number;
  cited: string[];
  suggestedDraft: boolean;
  refused: boolean;
  model: string | null;
}

/**
 * What customers ask the assistant, kept for a while.
 *
 * Its use is the business question the catalogue can't answer by itself:
 * what are people looking for that we don't sell? A question the search
 * found nothing for, or one where the assistant offered a custom draft, is
 * a document someone wanted — the list of those is the client's to-do list
 * for new forms.
 */
@Injectable()
export class AssistantLog {
  private readonly logger = new Logger(AssistantLog.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Saves one turn. Never throws: the customer already has their answer. */
  async record(turn: TurnRecord): Promise<void> {
    try {
      await this.prisma.assistantTurn.create({
        data: {
          conversationId: turn.conversationId,
          userId: turn.userId,
          question: turn.question.slice(0, MAX_TEXT),
          answer: turn.answer.slice(0, MAX_TEXT),
          hitCount: turn.hitCount,
          citedCount: turn.cited.length,
          cited: turn.cited,
          suggestedDraft: turn.suggestedDraft,
          refused: turn.refused,
          model: turn.model,
        },
      });
    } catch (error) {
      this.logger.warn(
        `Assistant turn not logged: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /** Deletes turns past the retention period. Returns how many went. */
  async purge(now = new Date()): Promise<number> {
    const cutoff = new Date(
      now.getTime() - ASSISTANT_LOG_RETENTION_DAYS * 24 * 3600_000,
    );
    const { count } = await this.prisma.assistantTurn.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });
    return count;
  }

  /**
   * The admin's view of the last `days`: how much the assistant is used,
   * how often it had nothing to recommend, and the questions behind that.
   */
  async insights(days: number) {
    const since = new Date(Date.now() - days * 24 * 3600_000);
    const inPeriod = { createdAt: { gte: since } };
    // "Unmatched": it recommended nothing, or offered to draft instead —
    // either way, the catalogue had no answer. Refusals are off-topic or
    // out of bounds, not missing products, so they don't count.
    const unmatchedWhere = {
      ...inPeriod,
      refused: false,
      OR: [{ citedCount: 0 }, { suggestedDraft: true }],
    };

    const [questions, conversations, unmatched, drafts, signedIn, gaps] =
      await Promise.all([
        this.prisma.assistantTurn.count({ where: inPeriod }),
        this.prisma.assistantTurn.groupBy({
          by: ["conversationId"],
          where: inPeriod,
        }),
        this.prisma.assistantTurn.count({ where: unmatchedWhere }),
        this.prisma.assistantTurn.count({
          where: { ...inPeriod, suggestedDraft: true },
        }),
        this.prisma.assistantTurn.count({
          where: { ...inPeriod, userId: { not: null } },
        }),
        this.prisma.assistantTurn.findMany({
          where: unmatchedWhere,
          orderBy: { createdAt: "desc" },
          take: 100,
          select: {
            id: true,
            question: true,
            suggestedDraft: true,
            createdAt: true,
          },
        }),
      ]);

    return {
      period: { days, since: since.toISOString() },
      questions,
      conversations: conversations.length,
      unmatched,
      draftOffers: drafts,
      signedIn,
      gaps,
    };
  }

  /** The newest conversations, each with its turns in order. */
  async recentConversations(limit = 20) {
    const latest = await this.prisma.assistantTurn.groupBy({
      by: ["conversationId"],
      _max: { createdAt: true },
      orderBy: { _max: { createdAt: "desc" } },
      take: limit,
    });
    if (latest.length === 0) return [];

    const turns = await this.prisma.assistantTurn.findMany({
      where: { conversationId: { in: latest.map((c) => c.conversationId) } },
      orderBy: { createdAt: "asc" },
      select: {
        conversationId: true,
        question: true,
        answer: true,
        cited: true,
        citedCount: true,
        suggestedDraft: true,
        refused: true,
        createdAt: true,
        // Whether they were signed in — not who: the insights are about
        // what was asked.
        userId: true,
      },
    });

    return latest.map(({ conversationId }) => {
      const own = turns.filter((t) => t.conversationId === conversationId);
      return {
        conversationId,
        signedIn: own.some((t) => t.userId !== null),
        startedAt: own[0]?.createdAt ?? null,
        turns: own.map((t) => ({
          question: t.question,
          answer: t.answer,
          cited: t.cited,
          citedCount: t.citedCount,
          suggestedDraft: t.suggestedDraft,
          refused: t.refused,
          createdAt: t.createdAt,
        })),
      };
    });
  }
}
