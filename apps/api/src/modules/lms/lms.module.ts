import { Module } from "@nestjs/common";

import { AuditModule } from "../audit/audit.module";

import { LmsController } from "./lms.controller";
import { LmsService } from "./lms.service";

@Module({
  imports: [AuditModule],
  controllers: [LmsController],
  providers: [LmsService],
  exports: [LmsService],
})
export class LmsModule {}
