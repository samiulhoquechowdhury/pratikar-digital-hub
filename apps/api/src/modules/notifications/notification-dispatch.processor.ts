import { OnWorkerEvent, Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import type { Job } from "bullmq";

import { reportFinalJobFailure } from "../../common/monitoring/job-failures";

import { NotificationsService } from "./notifications.service";
import {
  certificateIssued,
  courseExpiring,
  purchaseConfirmation,
  refundIssued,
  reviewReady,
  staffNewOrder,
  staffReviewRequested,
  type CertificatePayload,
  type CourseExpiringPayload,
  type PurchasePayload,
  type RefundPayload,
  type RenderedEmail,
  type ReviewReadyPayload,
  type StaffNewOrderPayload,
  type StaffReviewRequestedPayload,
} from "./templates";

/**
 * A discriminated union rather than a `type: string` plus a loose payload:
 * adding a notification without giving it a renderer should be a compile
 * error, not a job that fails at three in the morning.
 */
export type NotificationJob =
  | { type: "purchase"; to: string; payload: PurchasePayload }
  | { type: "review-ready"; to: string; payload: ReviewReadyPayload }
  | { type: "refund"; to: string; payload: RefundPayload }
  | { type: "certificate"; to: string; payload: CertificatePayload }
  | { type: "course-expiring"; to: string; payload: CourseExpiringPayload }
  | { type: "staff-new-order"; to: string; payload: StaffNewOrderPayload }
  | {
      type: "staff-review-requested";
      to: string;
      payload: StaffReviewRequestedPayload;
    };

/**
 * Renders a job's email. A switch over the union, so a notification type
 * added without a renderer fails to compile rather than at send time.
 */
export function render(job: NotificationJob): RenderedEmail {
  switch (job.type) {
    case "purchase":
      return purchaseConfirmation(job.payload);
    case "review-ready":
      return reviewReady(job.payload);
    case "refund":
      return refundIssued(job.payload);
    case "certificate":
      return certificateIssued(job.payload);
    case "course-expiring":
      // Dates arrive from Redis as strings; the template wants a Date.
      return courseExpiring({
        ...job.payload,
        expiresAt: new Date(job.payload.expiresAt),
      });
    case "staff-new-order":
      return staffNewOrder(job.payload);
    case "staff-review-requested":
      return staffReviewRequested(job.payload);
  }
}

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
    const { type, to } = job.data;
    const rendered = render(job.data);

    await this.notifications.sendEmail(to, rendered.subject, rendered.html);
    this.logger.log(`Sent "${type}" to ${to}`);
  }

  /** Reports the job to monitoring once its last retry has failed. */
  @OnWorkerEvent("failed")
  onFailed(job: Job | undefined, error: Error) {
    reportFinalJobFailure(job, error);
  }
}
