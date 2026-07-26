import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

import { Injectable } from "@nestjs/common";

const OTP_LENGTH = 6;
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;

@Injectable()
export class OtpService {
  private readonly secret = process.env.OTP_HMAC_SECRET ?? "dev-only-secret-change-me";

  generateCode(): string {
    return randomInt(0, 10 ** OTP_LENGTH).toString().padStart(OTP_LENGTH, "0");
  }

  hash(code: string, identifier: string): string {
    // Bind the hash to the identifier too, so a leaked hash for one
    // identifier can't be replayed against a different one.
    return createHmac("sha256", this.secret).update(`${identifier}:${code}`).digest("hex");
  }

  /** Constant-time compare — never use === on secret-derived values. */
  verifyHash(code: string, identifier: string, storedHash: string): boolean {
    const candidate = Buffer.from(this.hash(code, identifier));
    const stored = Buffer.from(storedHash);
    if (candidate.length !== stored.length) return false;
    return timingSafeEqual(candidate, stored);
  }

  get ttlMs(): number {
    return OTP_TTL_MS;
  }

  get maxAttempts(): number {
    return MAX_ATTEMPTS;
  }
}
