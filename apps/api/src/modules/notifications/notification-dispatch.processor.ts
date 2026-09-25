import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import type { Job } from "bullmq";

import { NotificationsService } from "./notifications.service";
import {
  purchaseConfirmation,
  refundIssued,
  reviewReady,
  type PurchasePayload,
  type RefundPayload,
  type ReviewReadyPayload,
} from "./templates";

/**
 * A discriminated union rather than a `type: string` plus a loose payload:
 * adding a notification without giving it a renderer should be a compile
 * error, not a job that fails at three in the morning.
 */
export type NotificationJob =
  | { type: "purchase"; to: string; payload: PurchasePayload }
  | { type: "review-ready"; to: string; payload: ReviewReadyPayload }
  | { type: "refund"; to: string; payload: RefundPayload };

export const NOTIFICATION_QUEUE = "notification-dispatch";

/**
 * Sends the mail, out of band.
 *
 * Everything that triggers a notification is something the customer already
 * paid for or is waiting on — a captured payment, a returned review — and
 * none of it should wait on an SMTP round trip. The payment webhook is the
 * sharp case: Razorpay retries anything that is not a fast 2xx, so an email
 * provider having a slow afternoon would look to it like a failed payment.
 *
 * Retries are BullMQ's (see the queue registration). A send that fails three
 * times lands in the failed set rather than disappearing, which is the whole
 * reason this is a queue and not a fire-and-forget promise.
 */
@Processor(NOTIFICATION_QUEUE)
export class NotificationDispatchProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationDispatchProcessor.name);

  constructor(private readonly notifications: NotificationsService) {
    super();
  }

  async process(job: Job<NotificationJob>): Promise<void> {
    const { type, to, payload } = job.data;

    const rendered =
      type === "purchase"
        ? purchaseConfirmation(payload)
        : type === "review-ready"
          ? reviewReady(payload)
          : refundIssued(payload);

    await this.notifications.sendEmail(to, rendered.subject, rendered.html);
    this.logger.log(`Sent "${type}" to ${to}`);
  }
}
