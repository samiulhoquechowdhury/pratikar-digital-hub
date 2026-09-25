import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, Logger } from "@nestjs/common";
import type { Queue } from "bullmq";

import {
  NOTIFICATION_QUEUE,
  type NotificationJob,
} from "./notification-dispatch.processor";

/**
 * The one call every module makes to notify someone.
 *
 * Matches what docs/trd.md Section 4.5 asks for: a single internal entry
 * point, so swapping a provider later does not ripple through every module
 * that sends something.
 */
@Injectable()
export class NotificationSender {
  private readonly logger = new Logger(NotificationSender.name);

  constructor(@InjectQueue(NOTIFICATION_QUEUE) private readonly queue: Queue) {}

  /**
   * Queues a notification. Never throws.
   *
   * The callers are payment capture and review return — work that has already
   * succeeded by the time this runs. If Redis is unreachable, the right
   * outcome is a logged error and a customer who did not get an email, not a
   * payment that appears to have failed and gets retried.
   */
  async send(job: NotificationJob): Promise<void> {
    if (!job.to) {
      // Phone-only accounts have no address. Not an error — SMS is the
      // channel for them, and it is gated on the client's DLT registration.
      this.logger.log(`Skipped "${job.type}" — no email address on record`);
      return;
    }
    try {
      await this.queue.add(job.type, job);
    } catch (error) {
      this.logger.error(
        `Could not queue "${job.type}" for ${job.to}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
