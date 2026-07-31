import { createHmac, timingSafeEqual } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";

import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { Injectable, Logger } from "@nestjs/common";

// R2 upload/download abstraction (docs/architecture.md Section 4) — every
// module that needs object storage goes through this, so swapping providers
// later doesn't ripple through the codebase.
//
// No Cloudflare R2 account is provisioned yet (docs/implementation-plan.md
// Milestone 1 item 1 is still pending), so this falls back to local disk when
// the R2 env vars aren't set — same pattern as NotificationsService for Resend.
/** Long enough to start a download, short enough that a leaked link rots. */
const DOWNLOAD_URL_TTL_MS = 5 * 60_000;

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly bucket = process.env.R2_BUCKET;
  private readonly r2: S3Client | null;
  private readonly localDir = path.join(process.cwd(), ".storage-dev");
  private readonly urlSecret = process.env.STORAGE_URL_SECRET ?? "";

  constructor() {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY;
    const secretAccessKey = process.env.R2_SECRET_KEY;

    this.r2 =
      accountId && accessKeyId && secretAccessKey && this.bucket
        ? new S3Client({
            region: "auto",
            endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
            credentials: { accessKeyId, secretAccessKey },
          })
        : null;

    if (!this.r2) {
      fs.mkdirSync(this.localDir, { recursive: true });
      this.logger.warn(
        `R2 env vars not set — storing uploads on local disk at ${this.localDir} instead.`,
      );
    }
  }

  async upload(key: string, body: Buffer, contentType: string): Promise<void> {
    if (this.r2) {
      await this.r2.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
        }),
      );
      return;
    }

    const filePath = path.join(this.localDir, key);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, body);
  }

  async read(key: string): Promise<Buffer> {
    if (this.r2) {
      const res = await this.r2.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      const bytes = await res.Body?.transformToByteArray();
      if (!bytes) throw new Error(`Empty R2 object body for key ${key}`);
      return Buffer.from(bytes);
    }

    return fs.readFileSync(path.join(this.localDir, key));
  }

  /**
   * Mints a short-lived download URL for a key (docs/trd.md Section 8).
   *
   * Call this at download time, never at upload time: the result expires, so
   * a URL persisted in the database would be either useless or — if given a
   * long enough life to survive being stored — an unrevocable public link to
   * paid content. What goes in the database is the key; the URL is derived
   * from it once the caller's entitlement has been checked.
   *
   * The URL points at our own StorageController rather than at R2 directly.
   * Serving R2 presigned URLs (@aws-sdk/s3-request-presigner) would take our
   * bandwidth out of the path and is the obvious optimisation once R2 is
   * provisioned, but it is an optimisation — correctness does not depend on
   * it, and this way local dev and production enforce access identically.
   */
  signUrl(key: string, ttlMs = DOWNLOAD_URL_TTL_MS): string {
    const normalised = normaliseKey(key);
    const expiresAt = Date.now() + ttlMs;
    const signature = this.sign(normalised, expiresAt);
    const base = process.env.PUBLIC_API_URL ?? `http://localhost:${port()}`;
    return `${base}/storage/${normalised}?exp=${expiresAt}&sig=${signature}`;
  }

  /**
   * Both halves matter: the expiry limits how long a leaked link is worth
   * anything, and the signature is what stops a caller editing the key in the
   * URL to fetch an object they never paid for.
   */
  verifyDownloadUrl(key: string, exp: string, sig: string): boolean {
    const expiresAt = Number(exp);
    if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false;

    const expected = Buffer.from(this.sign(normaliseKey(key), expiresAt));
    const actual = Buffer.from(sig);
    if (expected.length !== actual.length) return false;
    return timingSafeEqual(expected, actual);
  }

  private sign(key: string, expiresAt: number): string {
    // Fail loudly rather than signing with an empty key: an attacker who knows
    // the secret is empty can mint URLs for any object in the bucket.
    if (!this.urlSecret) {
      throw new Error(
        "STORAGE_URL_SECRET is not set — refusing to sign download URLs",
      );
    }
    return createHmac("sha256", this.urlSecret)
      .update(`${key}:${expiresAt}`)
      .digest("hex");
  }
}

const port = () => process.env.PORT ?? 4000;

/**
 * Earlier builds stored a fully-qualified URL in fileUrl instead of a key, so
 * rows written before that change still carry one. Reduce to the key so those
 * downloads keep working and can be signed like any other.
 */
function normaliseKey(keyOrUrl: string): string {
  const withoutOrigin = keyOrUrl.replace(/^https?:\/\/[^/]+/, "");
  return withoutOrigin.replace(/^\/?storage\//, "").replace(/^\/+/, "");
}
