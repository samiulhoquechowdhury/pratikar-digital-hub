import * as Sentry from "@sentry/nextjs";

import { monitoringOptions } from "./shared/lib/monitoring/options";

/**
 * Error monitoring on the server and edge runtimes — off unless
 * NEXT_PUBLIC_SENTRY_DSN is set. The browser side is instrumentation-client.ts.
 */
export function register() {
  const options = monitoringOptions();
  if (options) Sentry.init(options);
}

/** Reports errors thrown while rendering a page or handling a request. */
export const onRequestError = Sentry.captureRequestError;
