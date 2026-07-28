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
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly bucket = process.env.R2_BUCKET;
  private readonly r2: S3Client | null;
  private readonly localDir = path.join(process.cwd(), ".storage-dev");

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
   * TODO: once R2 is provisioned, replace with a real presigned URL
   * (@aws-sdk/s3-request-presigner) — docs/trd.md Section 8 calls for a
   * short-lived signed URL, not a permanently public one. The local-disk
   * fallback URL below is served by StorageController for dev only.
   */
  getUrl(key: string): string {
    if (this.r2) return `https://${this.bucket}.r2.dev/${key}`;
    const port = process.env.PORT ?? 4000;
    return `http://localhost:${port}/storage/${key}`;
  }
}
