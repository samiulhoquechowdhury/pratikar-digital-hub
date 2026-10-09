import { Injectable, NotFoundException } from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service";
import { KnowledgeBaseIndexer } from "../ai/knowledge-base/knowledge-base-indexer.service";
import {
  AuditAction,
  AuditService,
  AuditTargetType,
} from "../audit/audit.service";

import type { UpsertFaqDto } from "./dto/faq.dto";

/**
 * The FAQ page's questions. Every change re-indexes the entry, so the
 * assistant answers from the published wording and stops quoting one the
 * moment it's unpublished or deleted.
 */
@Injectable()
export class FaqService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly knowledgeBase: KnowledgeBaseIndexer,
  ) {}

  /** The public page: published entries, grouped by category in order. */
  async published() {
    const rows = await this.prisma.faq.findMany({
      where: { published: true },
      orderBy: [{ category: "asc" }, { order: "asc" }, { createdAt: "asc" }],
      select: { id: true, question: true, answer: true, category: true },
    });
    const groups = new Map<string, typeof rows>();
    for (const row of rows) {
      groups.set(row.category, [...(groups.get(row.category) ?? []), row]);
    }
    return [...groups.entries()].map(([category, items]) => ({
      category,
      items: items.map(({ category: _c, ...item }) => item),
    }));
  }

  /** Every entry, drafts included, for the admin. */
  all() {
    return this.prisma.faq.findMany({
      orderBy: [{ category: "asc" }, { order: "asc" }, { createdAt: "asc" }],
    });
  }

  async create(dto: UpsertFaqDto, actorUserId: string) {
    const faq = await this.prisma.$transaction(async (tx) => {
      const created = await tx.faq.create({ data: clean(dto) });
      await this.audit.recordWith(tx, {
        actorUserId,
        action: AuditAction.FAQ_CREATED,
        targetType: AuditTargetType.FAQ,
        targetId: created.id,
        metadata: { question: created.question, published: created.published },
      });
      return created;
    });
    await this.knowledgeBase.reindex({ sourceType: "faq", sourceId: faq.id });
    return faq;
  }

  async update(id: string, dto: UpsertFaqDto, actorUserId: string) {
    const faq = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.faq.findUnique({ where: { id } });
      if (!existing) throw new NotFoundException("FAQ_NOT_FOUND");
      const updated = await tx.faq.update({ where: { id }, data: clean(dto) });
      await this.audit.recordWith(tx, {
        actorUserId,
        action: AuditAction.FAQ_UPDATED,
        targetType: AuditTargetType.FAQ,
        targetId: id,
        metadata: {
          question: updated.question,
          publishedFrom: existing.published,
          publishedTo: updated.published,
        },
      });
      return updated;
    });
    await this.knowledgeBase.reindex({ sourceType: "faq", sourceId: id });
    return faq;
  }

  async remove(id: string, actorUserId: string) {
    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.faq.findUnique({ where: { id } });
      if (!existing) throw new NotFoundException("FAQ_NOT_FOUND");
      await tx.faq.delete({ where: { id } });
      await this.audit.recordWith(tx, {
        actorUserId,
        action: AuditAction.FAQ_DELETED,
        targetType: AuditTargetType.FAQ,
        targetId: id,
        metadata: { question: existing.question },
      });
    });
    // The worker finds the row gone and removes it from the index.
    await this.knowledgeBase.reindex({ sourceType: "faq", sourceId: id });
    return { deleted: true };
  }
}

const clean = (dto: UpsertFaqDto) => ({
  question: dto.question.trim(),
  answer: dto.answer.trim(),
  category: dto.category.trim(),
  order: dto.order,
  published: dto.published,
});
