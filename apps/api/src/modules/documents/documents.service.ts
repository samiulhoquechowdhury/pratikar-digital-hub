import { InjectQueue } from "@nestjs/bullmq";
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Role } from "@pratikar/types";
import type { Prisma } from "@prisma/client";
import type { Queue } from "bullmq";

import { PrismaService } from "../../prisma/prisma.service";
import {
  AuditAction,
  AuditService,
  AuditTargetType,
} from "../audit/audit.service";

import type { DocumentGenerationJobData } from "./document-generation.processor";
import { GenerateDocumentDto } from "./dto/generate-document.dto";
import { UpsertTemplateDto } from "./dto/upsert-template.dto";

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    @InjectQueue("document-generation")
    private readonly documentGenerationQueue: Queue<DocumentGenerationJobData>,
  ) {}

  listPublishedTemplates() {
    return this.prisma.template.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Every template regardless of status — the admin Template CRUD screens need
   * to see DRAFT and ARCHIVED rows, which listPublishedTemplates deliberately
   * hides from customers. Staff-only at the controller.
   */
  listAllTemplates() {
    return this.prisma.template.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  /** Single template of any status, for the admin edit screen. Staff-only. */
  async getTemplateById(templateId: string) {
    const template = await this.prisma.template.findUnique({
      where: { id: templateId },
    });
    if (!template) throw new NotFoundException("TEMPLATE_NOT_FOUND");
    return template;
  }

  async upsertTemplate(
    dto: UpsertTemplateDto,
    actorUserId: string,
    templateId?: string,
  ) {
    // Prisma's Json input type doesn't structurally match the TemplateFieldDto[]
    // shape (it wants a plain index signature) — this cast is the standard,
    // safe way to hand validated JSON to a Json column; the DTO's nested
    // class-validator decorators already checked the shape at the HTTP boundary.
    const fieldSchema = dto.fieldSchema as unknown as Prisma.InputJsonValue;

    // Template write and its audit row share one transaction — see
    // AuditService.recordWith for why this is atomic rather than best-effort.
    return this.prisma.$transaction(async (tx) => {
      if (templateId) {
        // Fail before writing the audit row if the id doesn't exist, so an
        // update of a missing template can't leave a TEMPLATE_UPDATED entry.
        const existing = await tx.template.findUnique({
          where: { id: templateId },
        });
        if (!existing) throw new NotFoundException("TEMPLATE_NOT_FOUND");

        const updated = await tx.template.update({
          where: { id: templateId },
          data: { ...dto, fieldSchema },
        });

        await this.audit.recordWith(tx, {
          actorUserId,
          action: AuditAction.TEMPLATE_UPDATED,
          targetType: AuditTargetType.TEMPLATE,
          targetId: updated.id,
          // Status transitions are the reviewable part of a template edit
          // (publishing is what makes it purchasable), so record them
          // explicitly rather than leaving a bare "it changed" entry.
          metadata: {
            title: updated.title,
            statusFrom: existing.status,
            statusTo: updated.status,
          },
        });

        return updated;
      }

      const created = await tx.template.create({
        data: { ...dto, fieldSchema, createdBy: actorUserId },
      });

      await this.audit.recordWith(tx, {
        actorUserId,
        action: AuditAction.TEMPLATE_CREATED,
        targetType: AuditTargetType.TEMPLATE,
        targetId: created.id,
        metadata: { title: created.title, status: created.status },
      });

      return created;
    });
  }

  async generate(userId: string, dto: GenerateDocumentDto) {
    const template = await this.prisma.template.findUnique({
      where: { id: dto.templateId },
    });
    if (!template || template.status !== "PUBLISHED") {
      throw new NotFoundException("TEMPLATE_NOT_FOUND");
    }

    const generatedDocument = await this.prisma.generatedDocument.create({
      data: {
        userId,
        templateId: dto.templateId,
        filledData: dto.filledData as Prisma.InputJsonValue,
        fileUrl: "", // set by the document-generation job once it completes
        status: "GENERATED",
      },
    });

    // Queued rather than run inline (docs/trd.md Section 4.2) — the
    // LibreOffice conversion step is slow (seconds, not ms) and would
    // otherwise block the request thread.
    await this.documentGenerationQueue.add("generate", {
      generatedDocumentId: generatedDocument.id,
    });

    return generatedDocument;
  }

  listMine(userId: string) {
    return this.prisma.generatedDocument.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { template: { select: { title: true } } },
    });
  }

  /** Called once the paid order for this document is confirmed (see PaymentsService). */
  async markPaid(documentId: string) {
    return this.prisma.generatedDocument.update({
      where: { id: documentId },
      data: { status: "PAID" },
    });
  }

  /**
   * One-time-use download (docs/srs.md Section 7, item 1): once the link is
   * consumed, the document moves to DOWNLOADED and any future attempt is
   * rejected — enforced here, not just by link expiry, so a stolen signed URL
   * doesn't help after the legitimate first use either.
   */
  async consumeDownload(
    documentId: string,
    requesterId: string,
    requesterRole: Role,
  ) {
    const doc = await this.prisma.generatedDocument.findUnique({
      where: { id: documentId },
    });
    if (!doc) throw new NotFoundException("DOCUMENT_NOT_FOUND");
    if (doc.userId !== requesterId && requesterRole === Role.CUSTOMER) {
      throw new ForbiddenException("NOT_YOUR_DOCUMENT");
    }
    if (doc.status === "DOWNLOADED") {
      throw new ForbiddenException("ALREADY_DOWNLOADED");
    }
    if (doc.status !== "PAID") {
      throw new ForbiddenException("NOT_PAID");
    }

    await this.prisma.generatedDocument.update({
      where: { id: documentId },
      data: { status: "DOWNLOADED", downloadedAt: new Date() },
    });

    // TODO: generate the actual signed, short-lived R2 URL here (docs/trd.md
    // Section 8) rather than returning the stored fileUrl directly.
    return { fileUrl: doc.fileUrl };
  }

  /** Called by PaymentsService once a document-review order is confirmed paid. */
  async queueReview(
    generatedDocumentId: string,
    requestedByUserId: string,
    orderId: string,
  ) {
    return this.prisma.documentReview.create({
      data: {
        generatedDocumentId,
        requestedByUserId,
        orderId,
        status: "QUEUED",
      },
    });
  }

  /** Atomic-claim pattern (docs/trd.md Section 4.3) — prevents two Content
   * Managers claiming the same queue item. Zero rows updated means someone
   * else already claimed it first. */
  async claimReview(reviewId: string, reviewerId: string) {
    const result = await this.prisma.documentReview.updateMany({
      where: { id: reviewId, assignedToUserId: null },
      data: { assignedToUserId: reviewerId, status: "IN_REVIEW" },
    });
    if (result.count === 0) {
      throw new ForbiddenException("ALREADY_CLAIMED");
    }
    return this.prisma.documentReview.findUnique({ where: { id: reviewId } });
  }

  async returnReview(
    reviewId: string,
    reviewedFileUrl: string,
    notes?: string,
  ) {
    // TODO: trigger the `notification-dispatch` job here (docs/trd.md Section
    // 6) to send the Android push notification confirmed in docs/srs.md 3.8.
    return this.prisma.documentReview.update({
      where: { id: reviewId },
      data: { status: "RETURNED", reviewedFileUrl, notes },
    });
  }

  listReviewQueue() {
    return this.prisma.documentReview.findMany({
      where: { status: { in: ["QUEUED", "IN_REVIEW"] } },
      orderBy: { createdAt: "asc" },
      include: {
        generatedDocument: {
          include: { template: { select: { title: true } } },
        },
      },
    });
  }
}
