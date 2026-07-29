import { Module } from "@nestjs/common";

import { AuditModule } from "../audit/audit.module";
import { DocumentsModule } from "../documents/documents.module";
import { LmsModule } from "../lms/lms.module";

import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { RazorpayService } from "./razorpay.service";

@Module({
  imports: [AuditModule, DocumentsModule, LmsModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, RazorpayService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
