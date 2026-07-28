import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";

import { StorageModule } from "../storage/storage.module";

import { DocumentGenerationProcessor } from "./document-generation.processor";
import { DocumentsController } from "./documents.controller";
import { DocumentsService } from "./documents.service";

@Module({
  imports: [
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
