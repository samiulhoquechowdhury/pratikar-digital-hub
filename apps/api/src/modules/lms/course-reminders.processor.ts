import {
  InjectQueue,
  OnWorkerEvent,
  Processor,
  WorkerHost,
} from "@nestjs/bullmq";
import { Logger, type OnModuleInit } from "@nestjs/common";
import type { Job, Queue } from "bullmq";

import { reportFinalJobFailure } from "../../common/monitoring/job-failures";

import { LmsService } from "./lms.service";

export const COURSE_REMINDERS_QUEUE = "course-reminders";

/**
 * Runs the course-expiry reminders once a day, at 10:00 in India — a time
 * someone reads email, not the middle of the night.
 *
 * A BullMQ job scheduler rather than a timer in the process: Redis holds the
 * schedule, so it runs once a day however many API instances there are.
 */
@Processor(COURSE_REMINDERS_QUEUE)
export class CourseRemindersProcessor
  extends WorkerHost
  implements OnModuleInit
{
  private readonly logger = new Logger(CourseRemindersProcessor.name);

  constructor(
    private readonly lms: LmsService,
    @InjectQueue(COURSE_REMINDERS_QUEUE) private readonly queue: Queue,
  ) {
    super();
  }

  async onModuleInit() {
    await this.queue.upsertJobScheduler(
      "course-expiry-reminders",
      { pattern: "0 10 * * *", tz: "Asia/Kolkata" },
      { name: "expiry-reminders" },
    );
  }

  async process(_job: Job) {
    const result = await this.lms.sendExpiryReminders();
    if (result.sent > 0) {
      this.logger.log(`Sent ${result.sent} course-expiry reminders`);
    }
    return result;
  }

  /** Reports the run to monitoring once its last retry has failed. */
  @OnWorkerEvent("failed")
  onFailed(job: Job | undefined, error: Error) {
    reportFinalJobFailure(job, error);
  }
}
