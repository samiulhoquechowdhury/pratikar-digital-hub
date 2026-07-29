import { Injectable, NotFoundException } from "@nestjs/common";
import type { ContentCategory } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";
import {
  AuditAction,
  AuditService,
  AuditTargetType,
} from "../audit/audit.service";

import { UpsertContentItemDto } from "./dto/upsert-content-item.dto";

@Injectable()
export class ContentLibraryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // Re-download policy for this module is still open (docs/srs.md Section 8)
  // — unlike Documents, there's no one-time-use enforcement here yet.

  listPublished(category?: string) {
    return this.prisma.contentLibraryItem.findMany({
      where: {
        status: "PUBLISHED",
        ...(category ? { category: category as ContentCategory } : {}),
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /** Every status — the admin screens need DRAFT and ARCHIVED rows. */
  listAll() {
    return this.prisma.contentLibraryItem.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async getById(itemId: string) {
    const item = await this.prisma.contentLibraryItem.findUnique({
      where: { id: itemId },
    });
    if (!item) throw new NotFoundException("CONTENT_ITEM_NOT_FOUND");
    return item;
  }

  async upsert(
    dto: UpsertContentItemDto,
    actorUserId: string,
    itemId?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      if (itemId) {
        // Check before writing so a 404 can't leave an UPDATED audit entry
        // for an item that was never touched.
        const existing = await tx.contentLibraryItem.findUnique({
          where: { id: itemId },
        });
        if (!existing) throw new NotFoundException("CONTENT_ITEM_NOT_FOUND");

        const updated = await tx.contentLibraryItem.update({
          where: { id: itemId },
          data: dto,
        });

        await this.audit.recordWith(tx, {
          actorUserId,
          action: AuditAction.CONTENT_ITEM_UPDATED,
          targetType: AuditTargetType.CONTENT_ITEM,
          targetId: updated.id,
          metadata: {
            title: updated.title,
            statusFrom: existing.status,
            statusTo: updated.status,
          },
        });

        return updated;
      }

      const created = await tx.contentLibraryItem.create({ data: dto });

      await this.audit.recordWith(tx, {
        actorUserId,
        action: AuditAction.CONTENT_ITEM_CREATED,
        targetType: AuditTargetType.CONTENT_ITEM,
        targetId: created.id,
        metadata: { title: created.title, status: created.status },
      });

      return created;
    });
  }
}
