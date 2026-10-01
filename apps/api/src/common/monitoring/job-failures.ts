import * as Sentry from "@sentry/nestjs";
import type { Job } from "bullmq";

/**
 * Reports a background job that has failed for good.
 *
 * Only the last attempt: a job that fails once and succeeds on retry — an
 * email provider's slow minute — is the queue working as designed, and
 * reporting every attempt would bury the failures that matter.
 *
 * The job's data is not attached. It is ids today, but a job is the kind of
 * thing that grows a customer's email or a document's answers later, and the
 * queue name, job name and stack trace are enough to find the bug.
 */
export function reportFinalJobFailure(
  job:
    | Pick<Job, "attemptsMade" | "opts" | "queueName" | "name" | "id">
    | undefined,
  error: Error,
): boolean {
  if (!job) return false;
  const allowed = job.opts.attempts ?? 1;
  if (job.attemptsMade < allowed) return false;

  Sentry.captureException(error, {
    tags: { queue: job.queueName, job: job.name },
    extra: { jobId: job.id, attempts: job.attemptsMade },
  });
  return true;
}
