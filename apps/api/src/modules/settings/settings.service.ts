import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { Role } from "@pratikar/types";
import type { Prisma } from "@prisma/client";
import { plainToInstance, type ClassConstructor } from "class-transformer";
import { validateSync } from "class-validator";

import { PrismaService } from "../../prisma/prisma.service";
import {
  AuditAction,
  AuditService,
  AuditTargetType,
} from "../audit/audit.service";

import { CertificateSettingsDto, PricingSettingsDto } from "./dto/settings.dto";
import {
  SETTING_KEYS,
  SETTINGS,
  type SettingKey,
  type SettingValues,
} from "./settings.definitions";

/** Values are read on every page that shows them; a short cache is enough. */
const CACHE_MS = 30_000;

const DTOS = {
  certificate: CertificateSettingsDto,
  pricing: PricingSettingsDto,
} as const;

/**
 * Settings staff change in the admin panel instead of by redeploying. Each
 * has a default (settings.definitions.ts), so a fresh database — or one
 * where nobody has opened Settings yet — behaves exactly as before.
 */
@Injectable()
export class SettingsService {
  private cache = new Map<SettingKey, { value: unknown; at: number }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async get<K extends SettingKey>(key: K): Promise<SettingValues[K]> {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.at < CACHE_MS) {
      return cached.value as SettingValues[K];
    }
    const row = await this.prisma.siteSetting.findUnique({ where: { key } });
    // Stored values sit over the defaults, so a field added to a setting
    // later still has a value on rows saved before it existed.
    const value = {
      ...SETTINGS[key].defaults(),
      ...((row?.value ?? {}) as object),
    };
    this.cache.set(key, { value, at: Date.now() });
    return value;
  }

  /** What a custom AI draft's advocate review costs, before GST. */
  async customDraftReviewPrice(): Promise<number> {
    return (await this.get("pricing")).customDraftReviewPricePaise;
  }

  /** Every setting, with whether this role may change it. */
  async list(role: Role) {
    return Promise.all(
      SETTING_KEYS.map(async (key) => ({
        key,
        label: SETTINGS[key].label,
        canEdit: SETTINGS[key].editRoles.includes(role),
        value: await this.get(key),
      })),
    );
  }

  async update(key: string, input: unknown, actor: { id: string; role: Role }) {
    if (!SETTING_KEYS.includes(key as SettingKey)) {
      throw new NotFoundException("UNKNOWN_SETTING");
    }
    const settingKey = key as SettingKey;
    if (!SETTINGS[settingKey].editRoles.includes(actor.role)) {
      throw new ForbiddenException("NOT_ALLOWED_TO_EDIT");
    }

    // Validated against the setting's own DTO, whitelisted: the stored JSON
    // can only ever hold the fields the setting defines.
    const dto = plainToInstance(
      DTOS[settingKey] as ClassConstructor<object>,
      input ?? {},
    );
    const errors = validateSync(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    if (errors.length > 0) {
      throw new BadRequestException({
        message: "INVALID_SETTING",
        fields: errors.map((error) => error.property),
      });
    }
    const value = { ...dto } as unknown as Prisma.InputJsonValue;

    await this.prisma.$transaction(async (tx) => {
      await tx.siteSetting.upsert({
        where: { key: settingKey },
        create: { key: settingKey, value, updatedBy: actor.id },
        update: { value, updatedBy: actor.id },
      });
      await this.audit.recordWith(tx, {
        actorUserId: actor.id,
        action: AuditAction.SETTINGS_UPDATED,
        targetType: AuditTargetType.SETTING,
        targetId: settingKey,
        metadata: value,
      });
    });
    this.cache.delete(settingKey);
    return this.get(settingKey);
  }
}
