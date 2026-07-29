import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";

/**
 * Audit actions. Plain string constants rather than a Prisma enum: the SRS
 * expects this list to keep growing with every admin capability, and a DB enum
 * would mean a migration per addition for no integrity gain — the column is
 * only ever read back for display and filtering.
 */
export const AuditAction = {
  TEMPLATE_CREATED: "TEMPLATE_CREATED",
  TEMPLATE_UPDATED: "TEMPLATE_UPDATED",
} as const;

export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction];

export const AuditTargetType = {
  TEMPLATE: "TEMPLATE",
} as const;

export type AuditTargetType =
  (typeof AuditTargetType)[keyof typeof AuditTargetType];

export interface AuditEntry {
  actorUserId: string;
  action: AuditAction;
  targetType: AuditTargetType;
  targetId: string;
  metadata?: Prisma.InputJsonValue;
}

/**
 * Writes the AuditLog rows required by docs/srs.md Section 6 for admin
 * mutations. The table has existed since the initial schema but nothing wrote
 * to it — docs/implementation-plan.md Milestone 2 item 5 calls for baking this
 * in alongside the admin screens rather than retrofitting it later.
 */
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  /** Standalone write, for callers not already inside a transaction. */
  record(entry: AuditEntry) {
    return this.recordWith(this.prisma, entry);
  }

  /**
   * Writes through a caller-supplied client so the audit row and the mutation
   * it describes commit or roll back together. On a legal platform a mutation
   * that survived while its audit row vanished would be worse than the
   * mutation failing outright, so this is deliberately atomic rather than
   * best-effort fire-and-forget.
   */
  recordWith(client: Prisma.TransactionClient, entry: AuditEntry) {
    return client.auditLog.create({
      data: {
        actorUserId: entry.actorUserId,
        action: entry.action,
        targetType: entry.targetType,
        targetId: entry.targetId,
        metadata: entry.metadata,
      },
    });
  }
}
