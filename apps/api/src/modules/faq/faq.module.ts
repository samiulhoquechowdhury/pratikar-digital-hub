import { Module } from "@nestjs/common";

import { KnowledgeBaseModule } from "../ai/knowledge-base/knowledge-base.module";
import { AuditModule } from "../audit/audit.module";

import { FaqController } from "./faq.controller";
import { FaqService } from "./faq.service";

/** The public FAQ page and its admin. Entries feed the assistant's knowledge base. */
@Module({
  imports: [AuditModule, KnowledgeBaseModule],
  controllers: [FaqController],
  providers: [FaqService],
})
export class FaqModule {}
