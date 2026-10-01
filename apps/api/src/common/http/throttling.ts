import type { Provider } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, type ThrottlerModuleOptions } from "@nestjs/throttler";

/**
 * Rate limiting, as one definition shared by the app and its tests.
 *
 * ── WHY THE DEFAULT IS HIGH ─────────────────────────────────────────────
 * The default applies to every route without its own @Throttle, and it is
 * counted per client IP. One page on the site makes several API calls, and an
 * office or a mobile carrier puts many people behind one address — so a
 * default low enough to feel protective (the old 20/min) would start turning
 * real customers away the moment it was enforced. This one only catches
 * floods. Routes that need a real limit declare it: OTP request and verify,
 * refresh, the chatbot.
 *
 * Counts are kept in memory: per instance, reset on restart. Right for one
 * API instance; move to Redis-backed storage before running more than one.
 */
export const THROTTLER_OPTIONS: ThrottlerModuleOptions = [
  { name: "default", ttl: 60_000, limit: 240 },
];

/**
 * The guard, registered app-wide. Without it every @Throttle in the codebase
 * is metadata nothing reads — which is how the OTP limits went unenforced.
 */
export const throttlerGuardProvider: Provider = {
  provide: APP_GUARD,
  useClass: ThrottlerGuard,
};
