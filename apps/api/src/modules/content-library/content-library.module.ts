import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";

import { KnowledgeBaseModule } from "../ai/knowledge-base/knowledge-base.module";
import { AuditModule } from "../audit/audit.module";
import { StorageModule } from "../storage/storage.module";

import { ContentLibraryController } from "./content-library.controller";
import { ContentLibraryService } from "./content-library.service";
import {
  LIBRARY_PREVIEW_QUEUE,
  LibraryPreviewProcessor,
} from "./library-preview.processor";

@Module({
  imports: [
    AuditModule,
    KnowledgeBaseModule,
    StorageModule,
    BullModule.registerQueue({
      name: LIBRARY_PREVIEW_QUEUE,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 30_000 },
        // Removed either way, so the item id is free to be queued again: on
        // success for when its file changes, on failure so the next visit
        // retries. Only temporary trouble (storage, network) fails a job — a
        // file that can't be converted is recorded as "no preview" instead,
        // so this can't turn into a broken file re-rendering on every visit.
        // A failure that exhausts its retries is still reported to Sentry.
        removeOnComplete: true,
        removeOnFail: true,
      },
    }),
  ],
  controllers: [ContentLibraryController],
  providers: [ContentLibraryService, LibraryPreviewProcessor],
  exports: [ContentLibraryService],
})
export class ContentLibraryModule {}
