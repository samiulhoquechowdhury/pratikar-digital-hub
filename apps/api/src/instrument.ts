import { existsSync } from "node:fs";

import * as Sentry from "@sentry/nestjs";

import { DATA_COLLECTION } from "./common/monitoring/data-collection";
import { scrubReport } from "./common/monitoring/scrub";

/**
 * Error monitoring. Imported first thing in main.ts: Sentry has to be set up
 * before the modules it watches are loaded.
 *
 * Off unless SENTRY_DSN is set, so local development and tests send nothing.
 * Nest's ConfigModule reads .env later than this runs, so a DSN kept in the
 * local .env is loaded here directly; deployments set real environment
 * variables and have no .env file.
 */
if (existsSync(".env")) process.loadEnvFile(".env");

const dsn = process.env.SENTRY_DSN?.trim();

if (dsn) {
  Sentry.init({
    dsn,
    environment:
      process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? "development",
    release: process.env.SENTRY_RELEASE,
    // Collect nothing personal — see data-collection.ts for why each field
    // is switched off. scrubReport below is the second line, not the only one.
    dataCollection: DATA_COLLECTION,
    // Errors only. Performance tracing is a separate decision with its own
    // cost, and nothing here needs it yet.
    tracesSampleRate: 0,
    beforeSend: (event) => scrubReport(event),
  });
}

export const isMonitoringEnabled = Boolean(dsn);
