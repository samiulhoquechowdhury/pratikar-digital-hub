import { Module } from "@nestjs/common";

import { KnowledgeBaseModule } from "../ai/knowledge-base/knowledge-base.module";
import { AuditModule } from "../audit/audit.module";

import { LmsController, QuizAdminController } from "./lms.controller";
import { LmsService } from "./lms.service";
import { QuizService } from "./quiz.service";

@Module({
  imports: [AuditModule, KnowledgeBaseModule],
  controllers: [LmsController, QuizAdminController],
  providers: [LmsService, QuizService],
  exports: [LmsService],
})
export class LmsModule {}
