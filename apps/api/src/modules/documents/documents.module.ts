import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";

import { KnowledgeBaseModule } from "../ai/knowledge-base/knowledge-base.module";
import { AuditModule } from "../audit/audit.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { StorageModule } from "../storage/storage.module";

import { DocumentGenerationProcessor } from "./document-generation.processor";
import { DocumentsController } from "./documents.controller";
import { DocumentsService } from "./documents.service";

@Module({
  imports: [
    AuditModule,
    KnowledgeBaseModule,
    NotificationsModule,
    StorageModule,
    BullModule.registerQueue({
      name: "document-generation",
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
      },
    }),
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService, DocumentGenerationProcessor],
  exports: [DocumentsService],
})
export class DocumentsModule {}
