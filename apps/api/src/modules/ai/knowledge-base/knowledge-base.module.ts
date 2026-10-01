import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";

import {
  KNOWLEDGE_BASE_QUEUE,
  KnowledgeBaseIndexProcessor,
} from "./knowledge-base-index.processor";
import { KnowledgeBaseIndexer } from "./knowledge-base-indexer.service";
import { KnowledgeBaseController } from "./knowledge-base.controller";
import { VoyageEmbedder } from "./voyage-embedder.service";

/**
 * The RAG knowledge base (docs/trd.md 4.6): kept in step with templates,
 * courses and content items as they are saved.
 *
 * Its own module, depending on nothing but Prisma, because the modules it
 * indexes import it. It reads their tables directly rather than through their
 * services — importing DocumentsModule here would be a cycle.
 */
@Module({
  imports: [
    BullModule.registerQueue({
      name: KNOWLEDGE_BASE_QUEUE,
      defaultJobOptions: {
        // Generous, because the likely failure is Voyage rate-limiting a
        // full reindex, and that clears on its own given time.
        attempts: 5,
        backoff: { type: "exponential", delay: 30_000 },
        removeOnComplete: { age: 24 * 3600, count: 1000 },
        removeOnFail: { age: 30 * 24 * 3600 },
      },
    }),
  ],
  controllers: [KnowledgeBaseController],
  providers: [
    KnowledgeBaseIndexer,
    KnowledgeBaseIndexProcessor,
    VoyageEmbedder,
  ],
  exports: [KnowledgeBaseIndexer],
})
export class KnowledgeBaseModule {}
