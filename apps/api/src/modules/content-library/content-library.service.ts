import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { ContentCategory } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";
import {
  AuditAction,
  AuditService,
  AuditTargetType,
} from "../audit/audit.service";
import { StorageService } from "../storage/storage.service";

import { UpsertContentItemDto } from "./dto/upsert-content-item.dto";

/**
 * What a customer may see about an item they have not bought. Deliberately a
 * whitelist: a column added to the schema later should stay invisible here
 * until someone decides it belongs in the catalogue.
 */
const CATALOGUE_FIELDS = {
  id: true,
  title: true,
  category: true,
  type: true,
  priceInPaise: true,
  status: true,
  createdAt: true,
} as const;

@Injectable()
export class ContentLibraryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly storage: StorageService,
  ) {}

  // Re-download policy for this module is still open (docs/srs.md Section 8)
  // — unlike Documents, there's no one-time-use enforcement here yet.

  /**
   * The customer-facing catalogue. Selects columns explicitly rather than
   * returning the row: fileUrl is the storage key that resolveDownload treats
   * as the thing being paid for, so listing it here would hand every signed-in
   * visitor the contents of the library for free.
   */
  listPublished(category?: string) {
    return this.prisma.contentLibraryItem.findMany({
      where: {
        status: "PUBLISHED",
        ...(category ? { category: category as ContentCategory } : {}),
      },
      select: CATALOGUE_FIELDS,
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Detail view for a single item, for the same audience and with the same
   * exclusion. Scoped to PUBLISHED so a DRAFT item can't be previewed by
   * guessing its id.
   */
  async getPublished(itemId: string) {
    const item = await this.prisma.contentLibraryItem.findFirst({
      where: { id: itemId, status: "PUBLISHED" },
      select: CATALOGUE_FIELDS,
    });
    if (!item) throw new NotFoundException("CONTENT_ITEM_NOT_FOUND");
    return item;
  }

  /** Every status — the admin screens need DRAFT and ARCHIVED rows. */
  listAll() {
    return this.prisma.contentLibraryItem.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Entitlement check for a purchased item. There's no separate entitlement
   * row by design (see PaymentsService.grantEntitlement) — a PAID Order for
   * this user and item *is* the entitlement.
   *
   * Requiring status PAID also means a refund revokes access for free, since
   * refunding moves the order to REFUNDED. That differs from COURSE orders,
   * where the Enrollment row survives a refund (the open TODO in
   * PaymentsService.refund).
   *
   * Repeat downloads are allowed: unlike generated documents there's no
   * one-time-use rule here, and the re-download policy is still an open
   * question in docs/srs.md Section 8.
   */
  async resolveDownload(itemId: string, userId: string) {
    const item = await this.prisma.contentLibraryItem.findUnique({
      where: { id: itemId },
    });
    if (!item) throw new NotFoundException("CONTENT_ITEM_NOT_FOUND");

    const paidOrder = await this.prisma.order.findFirst({
      where: {
        userId,
        contentLibraryItemId: itemId,
        itemType: "CONTENT_ITEM",
        status: "PAID",
      },
    });
    if (!paidOrder) throw new ForbiddenException("NOT_PURCHASED");

    return { fileUrl: this.storage.signUrl(item.fileUrl), title: item.title };
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
