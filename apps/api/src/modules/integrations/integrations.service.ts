import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
  type OnModuleDestroy,
  type OnModuleInit,
} from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service";
import {
  AuditAction,
  AuditService,
  AuditTargetType,
} from "../audit/audit.service";

import {
  INTEGRATION_KEYS,
  INTEGRATIONS,
  type IntegrationKey,
} from "./integrations.definitions";

/** Other API instances pick up a change within this long. */
const REFRESH_MS = 60_000;

const isKey = (key: string): key is IntegrationKey =>
  (INTEGRATION_KEYS as readonly string[]).includes(key);

/**
 * API keys for outside services, entered by a Super Admin.
 *
 * Stored encrypted (AES-256-GCM) with a key that lives only in the server's
 * environment, so a copy of the database alone gives nothing away. Held in
 * memory once read, and looked up by every service at the moment it calls
 * out — so a key saved in the admin panel works on the next request. A value
 * saved here wins; with none, the environment variable of the same name is
 * used, as before this existed.
 */
@Injectable()
export class IntegrationsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(IntegrationsService.name);
  private values = new Map<IntegrationKey, string>();
  private timer?: NodeJS.Timeout;

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async onModuleInit() {
    await this.reload();
    this.timer = setInterval(() => void this.reload(), REFRESH_MS);
    this.timer.unref();
  }

  onModuleDestroy() {
    clearInterval(this.timer);
  }

  /** The value in use: the admin panel's, else the environment's, else "". */
  get(key: IntegrationKey): string {
    return this.values.get(key) ?? process.env[key] ?? "";
  }

  /** Where the value in use comes from. */
  source(key: IntegrationKey): "admin" | "server" | null {
    if (this.values.has(key)) return "admin";
    return process.env[key] ? "server" : null;
  }

  /** Every service with its fields, safe to send to the admin panel. */
  list() {
    return INTEGRATIONS.map((integration) => {
      const fields = integration.fields.map((field) => {
        const value = this.get(field.key);
        return {
          ...field,
          source: this.source(field.key),
          // A secret shows only its last four characters, ever.
          preview: !value
            ? null
            : field.secret
              ? `••••${value.slice(-4)}`
              : value,
        };
      });
      return {
        ...integration,
        fields,
        configured: fields.every((f) => !f.required || f.source !== null),
      };
    });
  }

  async set(key: string, raw: string, actorId: string): Promise<void> {
    if (!isKey(key)) throw new BadRequestException("UNKNOWN_SETTING");
    const value = raw.trim();
    if (!value) throw new BadRequestException("EMPTY_VALUE");
    const ciphertext = this.encrypt(value);
    await this.prisma.integrationSecret.upsert({
      where: { key },
      create: { key, ciphertext, updatedBy: actorId },
      update: { ciphertext, updatedBy: actorId },
    });
    // The value never goes in the audit log — only that it changed.
    await this.audit.record({
      actorUserId: actorId,
      action: AuditAction.INTEGRATION_UPDATED,
      targetType: AuditTargetType.INTEGRATION,
      targetId: key,
    });
    this.values.set(key, value);
  }

  /** Back to the server's environment value, if it has one. */
  async clear(key: string, actorId: string): Promise<void> {
    if (!isKey(key)) throw new BadRequestException("UNKNOWN_SETTING");
    await this.prisma.integrationSecret.deleteMany({ where: { key } });
    await this.audit.record({
      actorUserId: actorId,
      action: AuditAction.INTEGRATION_CLEARED,
      targetType: AuditTargetType.INTEGRATION,
      targetId: key,
    });
    this.values.delete(key);
  }

  private async reload() {
    try {
      const rows = await this.prisma.integrationSecret.findMany();
      const next = new Map<IntegrationKey, string>();
      for (const row of rows) {
        if (!isKey(row.key)) continue;
        try {
          next.set(row.key, this.decrypt(row.ciphertext));
        } catch {
          // Saved under a different encryption key. Ignored, so the
          // environment value (if any) is used; the admin can re-enter it.
          this.logger.error(
            `Couldn't decrypt ${row.key} — was INTEGRATIONS_ENCRYPTION_KEY changed? Re-enter it in Integrations.`,
          );
        }
      }
      this.values = next;
    } catch (error) {
      // Keep what we had: a database blip mustn't switch payments off.
      this.logger.warn(
        `Integrations not refreshed: ${(error as Error).message}`,
      );
    }
  }

  /**
   * The encryption key. INTEGRATIONS_ENCRYPTION_KEY in production — without
   * it nothing can be saved there. In development, derived from the JWT
   * secret so the feature works out of the box.
   */
  private cipherKey(): Buffer {
    const configured = process.env.INTEGRATIONS_ENCRYPTION_KEY;
    if (configured) return createHash("sha256").update(configured).digest();
    if (process.env.NODE_ENV === "production") {
      throw new ServiceUnavailableException("ENCRYPTION_KEY_NOT_SET");
    }
    const fallback =
      process.env.JWT_ACCESS_SECRET ?? "dev-only-secret-change-me";
    return createHash("sha256").update(`integrations:${fallback}`).digest();
  }

  private encrypt(plain: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", this.cipherKey(), iv);
    const body = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
    return [iv, cipher.getAuthTag(), body]
      .map((part) => part.toString("base64"))
      .join(".");
  }

  private decrypt(stored: string): string {
    const [iv, tag, body] = stored
      .split(".")
      .map((p) => Buffer.from(p, "base64"));
    if (!iv || !tag || !body) throw new Error("malformed");
    const decipher = createDecipheriv("aes-256-gcm", this.cipherKey(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(body), decipher.final()]).toString(
      "utf8",
    );
  }
}

/**
 * A setting's live value for a service that may be built without the
 * integrations store (a unit test, a script): the store's when there is one,
 * else the environment's.
 */
export const liveSetting = (
  integrations: IntegrationsService | undefined,
  key: IntegrationKey,
): string => integrations?.get(key) ?? process.env[key] ?? "";
