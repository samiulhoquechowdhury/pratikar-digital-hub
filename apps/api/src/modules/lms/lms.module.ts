import { Module } from "@nestjs/common";

import { AuditModule } from "../audit/audit.module";

import { LmsController, QuizAdminController } from "./lms.controller";
import { LmsService } from "./lms.service";
import { QuizService } from "./quiz.service";

@Module({
  imports: [AuditModule],
  controllers: [LmsController, QuizAdminController],
  providers: [LmsService, QuizService],
  exports: [LmsService],
})
export class LmsModule {}
