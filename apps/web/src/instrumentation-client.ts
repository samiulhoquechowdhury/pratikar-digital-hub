import * as Sentry from "@sentry/nextjs";

import { monitoringOptions } from "./shared/lib/monitoring/options";

// Error monitoring in the browser — off unless NEXT_PUBLIC_SENTRY_DSN is set.
const options = monitoringOptions();
if (options) Sentry.init(options);
