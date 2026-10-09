import {
  InjectQueue,
  OnWorkerEvent,
  Processor,
  WorkerHost,
} from "@nestjs/bullmq";
import { Logger, type OnModuleInit } from "@nestjs/common";
import type { Job, Queue } from "bullmq";

import { reportFinalJobFailure } from "../../../common/monitoring/job-failures";

import {
  ASSISTANT_LOG_RETENTION_DAYS,
  AssistantLog,
} from "./assistant-log.service";

export const ASSISTANT_LOG_QUEUE = "assistant-log-retention";

/**
 * Deletes assistant questions older than the retention period, once a day
 * at 03:30 in India. The privacy policy says how long they're kept; this is
 * what makes that true. A BullMQ job scheduler, so it runs once a day
 * however many API instances there are.
 */
@Processor(ASSISTANT_LOG_QUEUE)
export class AssistantLogRetentionProcessor
  extends WorkerHost
  implements OnModuleInit
{
  private readonly logger = new Logger(AssistantLogRetentionProcessor.name);

  constructor(
    private readonly log: AssistantLog,
    @InjectQueue(ASSISTANT_LOG_QUEUE) private readonly queue: Queue,
  ) {
    super();
  }

  async onModuleInit() {
    await this.queue.upsertJobScheduler(
      "assistant-log-purge",
      { pattern: "30 3 * * *", tz: "Asia/Kolkata" },
      { name: "purge" },
    );
  }

  async process(_job: Job) {
    const deleted = await this.log.purge();
    if (deleted > 0) {
      this.logger.log(
        `Deleted ${deleted} assistant questions older than ${ASSISTANT_LOG_RETENTION_DAYS} days`,
      );
    }
    return { deleted };
  }

  @OnWorkerEvent("failed")
  onFailed(job: Job | undefined, error: Error) {
    reportFinalJobFailure(job, error);
  }
}
