import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { ContentCategory } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";
import { KnowledgeBaseIndexer } from "../ai/knowledge-base/knowledge-base-indexer.service";
import {
  AuditAction,
  AuditService,
  AuditTargetType,
} from "../audit/audit.service";
import { StorageService } from "../storage/storage.service";

import {
  folderOf,
  isAppWritten,
  isSellable,
  suggestionFor,
  titleFromKey,
} from "./catalogue";
import { ImportContentItemsDto } from "./dto/import-content-items.dto";
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

/**
 * Refuses keys under the prefixes the app writes to — a customer's generated
 * document or invoice must never become something another customer can buy.
 */
function assertNotAppWritten(keys: string[]): void {
  const refused = keys.filter(isAppWritten);
  if (refused.length > 0) {
    throw new BadRequestException(`Not a library file: ${refused.join(", ")}`);
  }
}

@Injectable()
export class ContentLibraryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly storage: StorageService,
    private readonly knowledgeBase: KnowledgeBaseIndexer,
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
    assertNotAppWritten([dto.fileUrl]);

    const item = await this.prisma.$transaction(async (tx) => {
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

    // After the commit, so the worker reads the row as saved.
    await this.knowledgeBase.reindex({
      sourceType: "content",
      sourceId: item.id,
    });
    return item;
  }

  /**
   * What is sitting in storage, and whether it has been catalogued yet.
   *
   * The bucket was filled directly rather than through the app — hundreds of
   * files that exist but are not for sale, because the storefront lists rows
   * and every row needs a title, a category and a price. This is the screen
   * that closes that gap.
   *
   * Already-catalogued keys are returned too, marked rather than filtered:
   * an operator running this a second time needs to see that a file is
   * handled, not have it silently vanish and wonder whether it uploaded.
   *
   * Files the app wrote itself are left out entirely, not counted as skipped:
   * they are customers' generated documents, invoices and credit notes, and
   * one bulk import of their folder would put them on sale.
   */
  async listStorageObjects(prefix?: string) {
    const [stored, existing] = await Promise.all([
      this.storage.list(prefix ?? ""),
      this.prisma.contentLibraryItem.findMany({ select: { fileUrl: true } }),
    ]);
    const catalogued = new Set(existing.map((row) => row.fileUrl));

    const objects = stored.filter((object) => !isAppWritten(object.key));

    const sellable = objects.filter((object) => isSellable(object.key));
    return {
      // Counted before filtering, so the screen can say "12 files skipped"
      // rather than quietly showing fewer than the bucket contains.
      totalObjects: objects.length,
      skippedUnsupported: objects.length - sellable.length,
      objects: sellable
        .map((object) => ({
          ...object,
          folder: folderOf(object.key),
          suggestedTitle: titleFromKey(object.key),
          ...suggestionFor(object.key),
          catalogued: catalogued.has(object.key),
        }))
        .sort((a, b) => a.key.localeCompare(b.key)),
    };
  }

  /**
   * Publishes a batch of stored files as catalogue items.
   *
   * Skips keys that already have a row instead of failing the batch: the
   * realistic use is selecting a whole folder, running it, adding more files
   * to the bucket, and running it again. A second pass should add what is
   * new and leave the rest alone, not error or duplicate.
   */
  async importFromStorage(dto: ImportContentItemsDto, actorUserId: string) {
    // The picker no longer offers these, but the keys arrive in the request
    // body, so a stale screen or a hand-made request could still send one.
    assertNotAppWritten(dto.items.map((item) => item.fileUrl));

    const keys = dto.items.map((item) => item.fileUrl);
    const existing = await this.prisma.contentLibraryItem.findMany({
      where: { fileUrl: { in: keys } },
      select: { fileUrl: true },
    });
    const taken = new Set(existing.map((row) => row.fileUrl));

    const fresh = dto.items.filter((item) => !taken.has(item.fileUrl));
    if (fresh.length === 0) {
      return { created: 0, skipped: dto.items.length };
    }

    const created = await this.prisma.$transaction(async (tx) => {
      await tx.contentLibraryItem.createMany({
        data: fresh.map((item) => ({
          title: item.title.trim(),
          category: item.category,
          type: item.type,
          priceInPaise: item.priceInPaise,
          fileUrl: item.fileUrl,
          status: dto.publish ? "PUBLISHED" : "DRAFT",
        })),
      });

      // One audit row for the batch, not one per file: the operator performed
      // a single act, and 181 identical entries would bury everything else in
      // the log rather than record anything more.
      await this.audit.recordWith(tx, {
        actorUserId,
        action: AuditAction.CONTENT_ITEM_CREATED,
        targetType: AuditTargetType.CONTENT_ITEM,
        targetId: fresh[0]!.fileUrl,
        metadata: {
          importedFromStorage: true,
          count: fresh.length,
          published: dto.publish === true,
          folders: [...new Set(fresh.map((i) => folderOf(i.fileUrl)))],
        },
      });

      return fresh.length;
    });

    // createMany returns no ids. A draft import has nothing to index, so the
    // lookup is only paid when the batch went straight on sale.
    if (dto.publish) {
      const rows = await this.prisma.contentLibraryItem.findMany({
        where: { fileUrl: { in: fresh.map((item) => item.fileUrl) } },
        select: { id: true },
      });
      await this.knowledgeBase.reindex(
        ...rows.map(({ id }) => ({
          sourceType: "content" as const,
          sourceId: id,
        })),
      );
    }

    return { created, skipped: dto.items.length - created };
  }
}
