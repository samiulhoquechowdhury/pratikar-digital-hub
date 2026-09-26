import { randomUUID } from "node:crypto";

import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import type { Job } from "bullmq";

import { PrismaService } from "../../../prisma/prisma.service";

import {
  contentHash,
  describeContentItem,
  describeCourse,
  describeTemplate,
  type KnowledgeSourceRef,
} from "./sources";
import { VoyageEmbedder } from "./voyage-embedder.service";

export const KNOWLEDGE_BASE_QUEUE = "knowledge-base-index";

export type IndexOutcome = "indexed" | "unchanged" | "removed" | "skipped";

/**
 * Brings one source's knowledge-base row in line with the source as it is now.
 *
 * The job carries only which row to look at, never its content: the worker
 * reads the row itself, so a retry an hour later indexes what is true an hour
 * later, and two edits in quick succession cannot land out of order.
 *
 * Only PUBLISHED rows are indexed. A draft is not for sale and an archived
 * course cannot be bought — recommending either is the stale-content problem
 * docs/trd.md 4.6 names as the reason this pipeline exists.
 */
@Processor(KNOWLEDGE_BASE_QUEUE)
export class KnowledgeBaseIndexProcessor extends WorkerHost {
  private readonly logger = new Logger(KnowledgeBaseIndexProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly embedder: VoyageEmbedder,
  ) {
    super();
  }

  async process(job: Job<KnowledgeSourceRef>): Promise<IndexOutcome> {
    const ref = job.data;
    const label = `${ref.sourceType} ${ref.sourceId}`;

    const content = await this.describe(ref);
    if (content === null) {
      // Removal needs no embedding, so it happens with or without a key —
      // unpublishing has to work in every environment.
      const { count } = await this.prisma.knowledgeBaseDocument.deleteMany({
        where: ref,
      });
      if (count > 0) this.logger.log(`Removed ${label}`);
      return "removed";
    }

    if (!this.embedder.isConfigured) {
      this.logger.warn(
        `Skipped ${label} — VOYAGE_API_KEY is not set. Reindex once it is.`,
      );
      return "skipped";
    }

    const hash = contentHash(this.embedder.model, content);
    const existing = await this.prisma.knowledgeBaseDocument.findUnique({
      where: { sourceType_sourceId: ref },
      select: { contentHash: true },
    });
    if (existing?.contentHash === hash) return "unchanged";

    const [embedding] = await this.embedder.embedDocuments([content]);
    // pgvector reads '[0.1,0.2,…]'; sent as a parameter and cast in SQL,
    // because Prisma cannot write an Unsupported column itself.
    const vector = `[${embedding!.join(",")}]`;

    await this.prisma.$executeRaw`
      INSERT INTO "KnowledgeBaseDocument"
        ("id", "sourceType", "sourceId", "content", "contentHash",
         "embeddingModel", "embedding", "updatedAt")
      VALUES
        (${randomUUID()}, ${ref.sourceType}, ${ref.sourceId}, ${content},
         ${hash}, ${this.embedder.model}, ${vector}::vector, now())
      ON CONFLICT ("sourceType", "sourceId") DO UPDATE SET
        "content" = EXCLUDED."content",
        "contentHash" = EXCLUDED."contentHash",
        "embeddingModel" = EXCLUDED."embeddingModel",
        "embedding" = EXCLUDED."embedding",
        "updatedAt" = now()`;

    this.logger.log(`Indexed ${label}`);
    return "indexed";
  }

  /** The text to embed, or null when the source should not be in the index. */
  private async describe(ref: KnowledgeSourceRef): Promise<string | null> {
    switch (ref.sourceType) {
      case "template": {
        const row = await this.prisma.template.findUnique({
          where: { id: ref.sourceId },
        });
        return row?.status === "PUBLISHED" ? describeTemplate(row) : null;
      }
      case "course": {
        const row = await this.prisma.course.findUnique({
          where: { id: ref.sourceId },
          include: { modules: { select: { title: true, order: true } } },
        });
        return row?.status === "PUBLISHED" ? describeCourse(row) : null;
      }
      case "content": {
        const row = await this.prisma.contentLibraryItem.findUnique({
          where: { id: ref.sourceId },
        });
        return row?.status === "PUBLISHED" ? describeContentItem(row) : null;
      }
    }
  }
}
