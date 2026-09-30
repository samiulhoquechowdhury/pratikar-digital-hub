import { Module } from "@nestjs/common";

import { KnowledgeBaseModule } from "../knowledge-base/knowledge-base.module";

import { anthropicProvider } from "./anthropic.provider";
import { ChatController } from "./chat.controller";
import { ChatService } from "./chat.service";

/** The site assistant: retrieval over the knowledge base, answers by Claude. */
@Module({
  imports: [KnowledgeBaseModule],
  controllers: [ChatController],
  providers: [ChatService, anthropicProvider],
})
export class ChatModule {}
