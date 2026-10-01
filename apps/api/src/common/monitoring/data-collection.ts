import type * as Sentry from "@sentry/nestjs";

type DataCollection = NonNullable<
  NonNullable<Parameters<typeof Sentry.init>[0]>["dataCollection"]
>;

/**
 * What the monitoring SDK may collect: nothing about the person or their
 * data. Written out field by field because Sentry's defaults are the
 * opposite — every one of these is on unless switched off, and several would
 * carry exactly what this product must not leak:
 *
 *   httpBodies            sign-in codes; the answers typed into a document
 *   stackFrameVariables   the same, captured from whatever variables were in
 *                         scope when an error was thrown
 *   databaseQueryData     query parameters: names, emails, addresses
 *   queues                job arguments
 *   genAI                 what customers ask the assistant
 *
 * scrubReport is the second layer, for anything that slips past this one.
 * Stack traces and a few lines of our own source around each frame are all a
 * report needs to find a bug.
 */
export const DATA_COLLECTION: DataCollection = {
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
