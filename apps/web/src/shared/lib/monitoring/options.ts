import type * as Sentry from "@sentry/nextjs";

import { scrubReport } from "./scrub";

type Options = NonNullable<Parameters<typeof Sentry.init>[0]>;

/**
 * What the monitoring SDK may collect on the website: nothing about the
 * person. Sentry's defaults collect all of this; each would carry something
 * this product must not leak — sign-in codes and document answers in request
 * bodies or in variables captured from stack frames, signed download tokens
 * in query strings. Same policy as the API's (data-collection.ts there).
 */
const DATA_COLLECTION: Options["dataCollection"] = {
  userInfo: false,
  cookies: false,
  httpHeaders: false,
  httpBodies: [],
  urlQueryParams: false,
  graphQL: { document: false, variables: false },
  genAI: { inputs: false, outputs: false },
  databaseQueryData: false,
  queues: false,
  stackFrameVariables: false,
};

/**
 * The browser, the server and the edge runtime all start Sentry with these.
 * NEXT_PUBLIC_ because the browser needs the DSN; a DSN only lets someone
 * send reports, not read them.
 */
export const monitoringOptions = (): Options | null => {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();
  if (!dsn) return null;
  return {
    dsn,
    environment:
      process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
    // Errors only; performance tracing is a separate decision.
    tracesSampleRate: 0,
    dataCollection: DATA_COLLECTION,
    beforeSend: (event) => scrubReport(event),
  };
};
