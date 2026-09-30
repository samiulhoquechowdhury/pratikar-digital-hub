import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, Logger } from "@nestjs/common";
import type { Queue } from "bullmq";

import { PrismaService } from "../../../prisma/prisma.service";

import { KNOWLEDGE_BASE_QUEUE } from "./knowledge-base-index.processor";
import type { KnowledgeSourceRef } from "./sources";

const jobFor = (ref: KnowledgeSourceRef) => ({
  name: `${ref.sourceType}:${ref.sourceId}`,
  data: ref,
});

/**
 * The call a module makes after changing something the chatbot may talk about.
 *
 * Every save asks, whatever changed and whatever the status: the worker is the
 * one place that decides whether a row belongs in the index, so the callers
 * cannot drift from it. An edit that changed nothing indexed costs one read.
 */
@Injectable()
export class KnowledgeBaseIndexer {
  private readonly logger = new Logger(KnowledgeBaseIndexer.name);

  constructor(
    @InjectQueue(KNOWLEDGE_BASE_QUEUE)
    private readonly queue: Queue<KnowledgeSourceRef>,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Queues a reindex. Never throws.
   *
   * Called after the caller's transaction has committed — never inside it, or
   * the worker could read the row before the change was visible. By then the
   * save has succeeded, and Redis being down should cost a stale index entry
   * (repaired by the next save or a full reindex), not a save that appears to
   * have failed.
   */
  async reindex(...refs: KnowledgeSourceRef[]): Promise<void> {
    if (refs.length === 0) return;
    try {
      await this.queue.addBulk(refs.map(jobFor));
    } catch (error) {
      this.logger.error(
        `Could not queue a reindex of ${refs.length} source(s): ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * Queues every source there is, plus everything already in the index.
   *
   * The second half is what makes this a repair as well as a backfill: a row
   * whose source has gone — or was unpublished while Redis was down — is
   * visited and removed, rather than lingering because nothing asked about it.
   *
   * Throws, unlike reindex(): an operator asked for this and should hear that
   * it did not happen.
   */
  async reindexAll(): Promise<{ queued: number }> {
    const [templates, courses, items, indexed] = await Promise.all([
      this.prisma.template.findMany({ select: { id: true } }),
      this.prisma.course.findMany({ select: { id: true } }),
      this.prisma.contentLibraryItem.findMany({ select: { id: true } }),
      this.prisma.knowledgeBaseDocument.findMany({
        select: { sourceType: true, sourceId: true },
      }),
    ]);

    const refs = new Map<string, KnowledgeSourceRef>();
    const add = (ref: KnowledgeSourceRef) =>
      refs.set(`${ref.sourceType}:${ref.sourceId}`, ref);

    templates.forEach(({ id }) =>
      add({ sourceType: "template", sourceId: id }),
    );
    courses.forEach(({ id }) => add({ sourceType: "course", sourceId: id }));
    items.forEach(({ id }) => add({ sourceType: "content", sourceId: id }));
    indexed.forEach((row) => add(row as KnowledgeSourceRef));

    await this.queue.addBulk([...refs.values()].map(jobFor));
    return { queued: refs.size };
  }
}
