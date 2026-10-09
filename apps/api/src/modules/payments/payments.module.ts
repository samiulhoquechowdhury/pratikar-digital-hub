import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";

import { AuditModule } from "../audit/audit.module";
import { DocumentsModule } from "../documents/documents.module";
import { LmsModule } from "../lms/lms.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { StorageModule } from "../storage/storage.module";

import { CreditNoteService } from "./invoice/credit-note.service";
import { InvoiceConfig } from "./invoice/invoice-config";
import { InvoiceService } from "./invoice/invoice.service";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { RazorpayService } from "./razorpay.service";
import {
  PAYMENT_RECONCILIATION_QUEUE,
  PaymentReconciliationProcessor,
} from "./reconciliation/payment-reconciliation.processor";
import { PaymentReconciliationService } from "./reconciliation/payment-reconciliation.service";

@Module({
  imports: [
    AuditModule,
    DocumentsModule,
    LmsModule,
    NotificationsModule,
    StorageModule,
    BullModule.registerQueue({
      name: PAYMENT_RECONCILIATION_QUEUE,
      defaultJobOptions: {
        // A failed sweep is simply run again ten minutes later; retrying it
        // sooner would only pile onto whatever made it fail.
        attempts: 1,
        removeOnComplete: { count: 100 },
        removeOnFail: { age: 7 * 24 * 3600 },
      },
    }),
  ],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    RazorpayService,
    InvoiceService,
    CreditNoteService,
    InvoiceConfig,
    PaymentReconciliationService,
    PaymentReconciliationProcessor,
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
