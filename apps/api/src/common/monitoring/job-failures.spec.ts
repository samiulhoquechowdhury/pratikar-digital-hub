import * as Sentry from "@sentry/nestjs";

import { reportFinalJobFailure } from "./job-failures";

jest.mock("@sentry/nestjs", () => ({ captureException: jest.fn() }));

describe("reportFinalJobFailure", () => {
  const job = (attemptsMade: number, attempts = 3) => ({
    id: "42",
    name: "purchase",
    queueName: "notification-dispatch",
    attemptsMade,
    opts: { attempts },
    // Never sent — asserted below.
    data: { to: "customer@example.in" },
  });

  afterEach(() => jest.clearAllMocks());

  // A retry that later succeeds is the queue doing its job, not a bug.
  it("stays quiet while retries remain", () => {
    expect(reportFinalJobFailure(job(1), new Error("smtp"))).toBe(false);
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it("reports the last failed attempt, without the job's data", () => {
    const error = new Error("smtp down");

    expect(reportFinalJobFailure(job(3), error)).toBe(true);

    expect(Sentry.captureException).toHaveBeenCalledWith(error, {
      tags: { queue: "notification-dispatch", job: "purchase" },
      extra: { jobId: "42", attempts: 3 },
    });
    expect(
      JSON.stringify(jest.mocked(Sentry.captureException).mock.calls),
    ).not.toContain("customer@example.in");
  });

  it("treats a job with no retry setting as one attempt", () => {
    expect(reportFinalJobFailure({ ...job(1), opts: {} }, new Error("x"))).toBe(
      true,
    );
  });

  it("ignores a failure with no job attached", () => {
    expect(reportFinalJobFailure(undefined, new Error("x"))).toBe(false);
  });
});
