import {
  checkOtpRateLimit,
  OTP_LIMITS,
  type OtpHistory,
} from "./otp-rate-limit";

const NOW = new Date("2026-09-25T12:00:00Z");
const agoSeconds = (s: number) => new Date(NOW.getTime() - s * 1000);
const history = (over: Partial<OtpHistory> = {}): OtpHistory => ({
  identifierTimestamps: [],
  ipTimestamps: [],
  ...over,
});

/**
 * Every send costs money — Resend today, MSG91 once SMS is live — and lands
 * in a real person's inbox. These limits are the only thing standing between
 * that and someone with a script.
 */
describe("checkOtpRateLimit", () => {
  it("allows the first request", () => {
    expect(checkOtpRateLimit(history(), NOW)).toEqual({ allowed: true });
  });

  describe("cooldown", () => {
    it("refuses a second code within the cooldown", () => {
      const result = checkOtpRateLimit(
        history({ identifierTimestamps: [agoSeconds(10)] }),
        NOW,
      );
      expect(result).toEqual({
        allowed: false,
        reason: "cooldown",
        retryAfterSeconds: 50,
      });
    });

    it("allows once the cooldown has passed", () => {
      expect(
        checkOtpRateLimit(
          history({ identifierTimestamps: [agoSeconds(61)] }),
          NOW,
        ),
      ).toEqual({ allowed: true });
    });

    // Someone stuck on a slow SMS deliberately presses resend; the number has
    // to be useful, not "try again later".
    it("says how many seconds are left", () => {
      const result = checkOtpRateLimit(
        history({ identifierTimestamps: [agoSeconds(59)] }),
        NOW,
      );
      expect(result).toMatchObject({ retryAfterSeconds: 1 });
    });
  });

  describe("per identifier", () => {
    it("refuses once the hourly limit is reached", () => {
      // Spread past the cooldown so this is the limit that fires, not that one.
      const stamps = Array.from(
        { length: OTP_LIMITS.perIdentifierPerHour },
        (_, i) => agoSeconds(120 + i * 300),
      );
      const result = checkOtpRateLimit(
        history({ identifierTimestamps: stamps }),
        NOW,
      );
      expect(result).toMatchObject({ allowed: false, reason: "identifier" });
    });

    it("forgets requests older than an hour", () => {
      const stamps = Array.from(
        { length: OTP_LIMITS.perIdentifierPerHour },
        () => agoSeconds(3601),
      );
      expect(
        checkOtpRateLimit(history({ identifierTimestamps: stamps }), NOW),
      ).toEqual({ allowed: true });
    });

    it("tells the caller when the window frees up", () => {
      const stamps = [
        agoSeconds(3000),
        ...Array.from({ length: OTP_LIMITS.perIdentifierPerHour - 1 }, (_, i) =>
          agoSeconds(120 + i * 60),
        ),
      ];
      const result = checkOtpRateLimit(
        history({ identifierTimestamps: stamps }),
        NOW,
      );
      // The oldest is 3000s old, so 600s remain of its hour.
      expect(result).toMatchObject({ retryAfterSeconds: 600 });
    });
  });

  describe("per IP", () => {
    /**
     * The identifier limit alone would not stop this: one host walking a list
     * of addresses stays under it for every single victim while sending
     * hundreds of messages.
     */
    it("refuses a host bombing many different identifiers", () => {
      const result = checkOtpRateLimit(
        history({
          identifierTimestamps: [],
          ipTimestamps: Array.from(
            { length: OTP_LIMITS.perIpPerHour },
            (_, i) => agoSeconds(60 + i * 10),
          ),
        }),
        NOW,
      );
      expect(result).toMatchObject({ allowed: false, reason: "ip" });
    });

    // An office or a carrier behind CGNAT shares one address, and locking out
    // a whole building is worse than a few extra codes.
    it("is more generous than the identifier limit", () => {
      expect(OTP_LIMITS.perIpPerHour).toBeGreaterThan(
        OTP_LIMITS.perIdentifierPerHour,
      );
    });
  });

  it("checks cooldown before the hourly limits", () => {
    // Both would fire; the cooldown gives the more useful number back.
    const stamps = Array.from(
      { length: OTP_LIMITS.perIdentifierPerHour },
      (_, i) => agoSeconds(5 + i * 300),
    );
    expect(
      checkOtpRateLimit(history({ identifierTimestamps: stamps }), NOW),
    ).toMatchObject({ reason: "cooldown" });
  });

  it("never returns a retryAfter of zero", () => {
    // A zero would have a client retry immediately and be refused again.
    for (const elapsed of [1, 30, 59, 59.9]) {
      const result = checkOtpRateLimit(
        history({ identifierTimestamps: [agoSeconds(elapsed)] }),
        NOW,
      );
      if (!result.allowed) expect(result.retryAfterSeconds).toBeGreaterThan(0);
    }
  });
});
