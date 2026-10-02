import {
  InjectQueue,
  OnWorkerEvent,
  Processor,
  WorkerHost,
} from "@nestjs/bullmq";
import { Logger, type OnModuleInit } from "@nestjs/common";
import type { Job, Queue } from "bullmq";

import { reportFinalJobFailure } from "../../../common/monitoring/job-failures";

import { PaymentReconciliationService } from "./payment-reconciliation.service";

export const PAYMENT_RECONCILIATION_QUEUE = "payment-reconciliation";

/** How often the sweep runs. Short enough that a stranded customer waits minutes, not hours. */
export const RECONCILE_EVERY_MS = 10 * 60_000;

/**
 * Runs the reconciliation sweep on a schedule.
 *
 * A BullMQ job scheduler rather than a timer in the process: Redis holds the
 * schedule, so with more than one API instance it still runs once per
 * interval, not once per instance, and a restart doesn't reset the clock.
 */
@Processor(PAYMENT_RECONCILIATION_QUEUE)
export class PaymentReconciliationProcessor
  extends WorkerHost
  implements OnModuleInit
{
  private readonly logger = new Logger(PaymentReconciliationProcessor.name);

  constructor(
    private readonly reconciliation: PaymentReconciliationService,
    @InjectQueue(PAYMENT_RECONCILIATION_QUEUE) private readonly queue: Queue,
  ) {
    super();
  }

  async onModuleInit() {
    // Upsert, keyed by id: every boot re-applies the same schedule instead of
    // adding another one.
    await this.queue.upsertJobScheduler(
      "reconcile-pending-payments",
      { every: RECONCILE_EVERY_MS },
      { name: "reconcile" },
    );
  }

  async process(_job: Job) {
    const result = await this.reconciliation.reconcileStale();
    if (result.settled > 0 || result.errors > 0) {
      this.logger.log(
        `Reconciled ${result.checked} orders: ${result.settled} settled, ${result.errors} errors`,
      );
    }
    return result;
  }

  /** Reports the run to monitoring once its last retry has failed. */
  @OnWorkerEvent("failed")
  onFailed(job: Job | undefined, error: Error) {
    reportFinalJobFailure(job, error);
  }
}
