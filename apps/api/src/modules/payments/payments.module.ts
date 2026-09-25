import { Module } from "@nestjs/common";

import { AuditModule } from "../audit/audit.module";
import { DocumentsModule } from "../documents/documents.module";
import { LmsModule } from "../lms/lms.module";
import { StorageModule } from "../storage/storage.module";

import { CreditNoteService } from "./invoice/credit-note.service";
import { InvoiceConfig } from "./invoice/invoice-config";
import { InvoiceService } from "./invoice/invoice.service";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { RazorpayService } from "./razorpay.service";

@Module({
  imports: [AuditModule, DocumentsModule, LmsModule, StorageModule],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    RazorpayService,
    InvoiceService,
    CreditNoteService,
    InvoiceConfig,
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
