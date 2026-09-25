/**
 * How often an OTP may be sent, as a pure decision.
 *
 * ── WHY THE ROUTE THROTTLE IS NOT ENOUGH ──────────────────────────────────
 * `@Throttle` on the controller counts requests per IP, in memory. That
 * resets on restart, is not shared between instances, and — the real gap —
 * says nothing about the *identifier*. Someone rotating IPs can send an
 * unlimited number of codes to one person's inbox or phone. That is an abuse
 * problem for them and a billing problem for us: every send costs money at
 * Resend, and will cost more at MSG91 once SMS is live.
 *
 * Three limits, each catching a different thing:
 *
 *   cooldown      hammering "resend" — by far the most common, usually not
 *                 malicious, and the one a frustrated user triggers
 *   per identifier bombing one victim's inbox from many addresses
 *   per IP        bombing many victims from one host
 *
 * Kept free of Nest and Prisma so the policy can be argued about and tested
 * as numbers, rather than by waiting out real clocks against a database.
 */

export const OTP_LIMITS = {
  /** No second code for the same identifier inside this window. */
  cooldownSeconds: 60,
  /** Per identifier, per hour. Generous enough for a genuinely stuck user. */
  perIdentifierPerHour: 5,
  /**
   * Per IP, per hour. Higher than the identifier limit because an office or a
   * mobile carrier behind CGNAT legitimately shares one address, and locking
   * out a whole building is a worse failure than letting a few extra codes
   * through.
   */
  perIpPerHour: 20,
} as const;

export type OtpRateDecision =
  | { allowed: true }
  | {
      allowed: false;
      reason: "cooldown" | "identifier" | "ip";
      retryAfterSeconds: number;
    };

export interface OtpHistory {
  /** createdAt of every request for this identifier within the last hour. */
  identifierTimestamps: Date[];
  /** createdAt of every request from this IP within the last hour. */
  ipTimestamps: Date[];
}

/**
 * Decides whether another code may be sent.
 *
 * `retryAfterSeconds` is always the wait until the *oldest* relevant request
 * falls out of the window, so the caller can tell someone when to come back
 * instead of "try again later".
 */
export function checkOtpRateLimit(
  history: OtpHistory,
  now: Date,
): OtpRateDecision {
  const hourAgo = now.getTime() - 3_600_000;
  const inLastHour = (stamps: Date[]) =>
    stamps
      .filter((s) => s.getTime() > hourAgo)
      .sort((a, b) => a.getTime() - b.getTime());

  const forIdentifier = inLastHour(history.identifierTimestamps);
  const forIp = inLastHour(history.ipTimestamps);

  // Cooldown first: it is the most likely to fire and gives the most useful
  // number back ("8 seconds"), where the hourly limits give minutes.
  const newest = forIdentifier[forIdentifier.length - 1];
  if (newest) {
    const elapsed = (now.getTime() - newest.getTime()) / 1000;
    if (elapsed < OTP_LIMITS.cooldownSeconds) {
      return {
        allowed: false,
        reason: "cooldown",
        retryAfterSeconds: Math.ceil(OTP_LIMITS.cooldownSeconds - elapsed),
      };
    }
  }

  if (forIdentifier.length >= OTP_LIMITS.perIdentifierPerHour) {
    return {
      allowed: false,
      reason: "identifier",
      retryAfterSeconds: secondsUntilWindowFrees(forIdentifier[0]!, now),
    };
  }

  if (forIp.length >= OTP_LIMITS.perIpPerHour) {
    return {
      allowed: false,
      reason: "ip",
      retryAfterSeconds: secondsUntilWindowFrees(forIp[0]!, now),
    };
  }

  return { allowed: true };
}

/** When the oldest request in the window expires out of it. */
function secondsUntilWindowFrees(oldest: Date, now: Date): number {
  const freesAt = oldest.getTime() + 3_600_000;
  return Math.max(1, Math.ceil((freesAt - now.getTime()) / 1000));
}

/**
 * What the caller is told.
 *
 * Deliberately identical whether or not an account exists for the identifier,
 * and identical across all three reasons. A different message per reason
 * would tell someone probing the endpoint which limit they hit, which is a
 * map of how to stay under it.
 */
export const OTP_RATE_LIMITED_MESSAGE =
  "Too many verification codes requested. Please wait before trying again.";
