import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";

import { KnowledgeBaseModule } from "../knowledge-base/knowledge-base.module";

import { anthropicProvider } from "./anthropic.provider";
import { AssistantInsightsController } from "./assistant-insights.controller";
import {
  ASSISTANT_LOG_QUEUE,
  AssistantLogRetentionProcessor,
} from "./assistant-log-retention.processor";
import { AssistantLog } from "./assistant-log.service";
import { ChatController } from "./chat.controller";
import { ChatService } from "./chat.service";

/** The site assistant: retrieval over the knowledge base, answers by Claude. */
@Module({
  imports: [
    KnowledgeBaseModule,
    BullModule.registerQueue({
      name: ASSISTANT_LOG_QUEUE,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 60_000 },
        removeOnComplete: { age: 7 * 24 * 3600, count: 30 },
        removeOnFail: { age: 30 * 24 * 3600 },
      },
    }),
  ],
  controllers: [ChatController, AssistantInsightsController],
  providers: [
    ChatService,
    AssistantLog,
    AssistantLogRetentionProcessor,
    anthropicProvider,
  ],
})
export class ChatModule {}
