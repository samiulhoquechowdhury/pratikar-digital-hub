import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../../prisma/prisma.service";

import type { KnowledgeSourceType } from "./sources";
import { VoyageEmbedder } from "./voyage-embedder.service";

/**
 * Below this cosine similarity a hit is dropped rather than shown to the
 * model. Measured on the live index with voyage-4: a matching product scores
 * about 0.55–0.65 and an unrelated one about 0.3, so the line sits between
 * them. The model still judges relevance — this only keeps clear noise out.
 */
export const MIN_SCORE = 0.4;

/** A search hit, as the chatbot is allowed to talk about it. */
export interface KnowledgeHit {
  sourceType: KnowledgeSourceType;
  sourceId: string;
  /** Read live from the source row, never from the indexed copy. */
  title: string;
  priceInPaise: number;
  /** The customer-facing page for this item. */
  href: string;
  /** The indexed text: what the item is, for the model to reason about. */
  content: string;
  score: number;
}

interface RawHit {
  sourceType: string;
  sourceId: string;
  content: string;
  score: number;
}

const HREF: Record<KnowledgeSourceType, (id: string) => string> = {
  template: (id) => `/documents/${id}`,
  course: (id) => `/courses/${id}`,
  content: (id) => `/content-library/${id}`,
};

/**
 * Finds the catalogue entries closest to a question, then checks each one
 * against its source table.
 *
 * The second step is the point. The index is updated by a queue, so for a
 * moment after an edit it can be behind: an item just unpublished may still
 * be in it, and a price just changed is not in it at all. Everything the
 * chatbot says about price or availability therefore comes from the row as
 * it is now, and a hit whose row is no longer published is dropped.
 */
@Injectable()
export class KnowledgeBaseSearch {
  constructor(
    private readonly prisma: PrismaService,
    private readonly embedder: VoyageEmbedder,
  ) {}

  get isConfigured(): boolean {
    return this.embedder.isConfigured;
  }

  async search(question: string, limit = 6): Promise<KnowledgeHit[]> {
    const vector = `[${(await this.embedder.embedQuery(question)).join(",")}]`;

    // Exact scan — see the migration for why there is no ANN index yet.
    const raw = await this.prisma.$queryRaw<RawHit[]>`
      SELECT "sourceType", "sourceId", "content",
             1 - ("embedding" <=> ${vector}::vector) AS "score"
      FROM "KnowledgeBaseDocument"
      ORDER BY "embedding" <=> ${vector}::vector
      LIMIT ${limit}`;

    const relevant = raw
      .map((hit) => ({ ...hit, score: Number(hit.score) }))
      .filter((hit) => hit.score >= MIN_SCORE);

    const live = await this.liveRows(relevant);
    return relevant.flatMap((hit) => {
      const row = live.get(`${hit.sourceType}:${hit.sourceId}`);
      if (!row) return [];
      const sourceType = hit.sourceType as KnowledgeSourceType;
      return [
        {
          sourceType,
          sourceId: hit.sourceId,
          title: row.title,
          priceInPaise: row.priceInPaise,
          href: HREF[sourceType](hit.sourceId),
          content: hit.content,
          score: hit.score,
        },
      ];
    });
  }

  /** Current title and price for each hit's row, PUBLISHED rows only. */
  private async liveRows(hits: RawHit[]) {
    const ids = (type: string) =>
      hits.filter((h) => h.sourceType === type).map((h) => h.sourceId);
    const where = (type: string) => ({
      id: { in: ids(type) },
      status: "PUBLISHED" as const,
    });
    const select = { id: true, title: true, priceInPaise: true } as const;

    const [templates, courses, items] = await Promise.all([
      ids("template").length
        ? this.prisma.template.findMany({ where: where("template"), select })
        : [],
      ids("course").length
        ? this.prisma.course.findMany({ where: where("course"), select })
        : [],
      ids("content").length
        ? this.prisma.contentLibraryItem.findMany({
            where: where("content"),
            select,
          })
        : [],
    ]);

    const rows = new Map<string, { title: string; priceInPaise: number }>();
    templates.forEach((r) => rows.set(`template:${r.id}`, r));
    courses.forEach((r) => rows.set(`course:${r.id}`, r));
    items.forEach((r) => rows.set(`content:${r.id}`, r));
    return rows;
  }
}
