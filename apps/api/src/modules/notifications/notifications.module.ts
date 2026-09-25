import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";

import {
  NOTIFICATION_QUEUE,
  NotificationDispatchProcessor,
} from "./notification-dispatch.processor";
import { NotificationSender } from "./notification-sender.service";
import { NotificationsService } from "./notifications.service";

@Module({
  imports: [
    BullModule.registerQueue({
      name: NOTIFICATION_QUEUE,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 10_000 },
        // Keep a window of history rather than everything: enough to see what
        // went out this week, not an unbounded list in Redis.
        removeOnComplete: { age: 7 * 24 * 3600, count: 1000 },
        removeOnFail: { age: 30 * 24 * 3600 },
      },
    }),
  ],
  providers: [
    NotificationsService,
    NotificationSender,
    NotificationDispatchProcessor,
  ],
  exports: [NotificationsService, NotificationSender],
})
export class NotificationsModule {}
