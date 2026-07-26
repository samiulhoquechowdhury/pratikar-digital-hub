import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type { Role } from "@pratikar/types";

import { PrismaService } from "../../prisma/prisma.service";
import { GenerateDocumentDto } from "./dto/generate-document.dto";
import { UpsertTemplateDto } from "./dto/upsert-template.dto";

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  listPublishedTemplates() {
    return this.prisma.template.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
    });
  }

  async upsertTemplate(dto: UpsertTemplateDto, actorUserId: string, templateId?: string) {
    if (templateId) {
      return this.prisma.template.update({ where: { id: templateId }, data: dto });
    }
    return this.prisma.template.create({ data: { ...dto, createdBy: actorUserId } });
  }

  async generate(userId: string, dto: GenerateDocumentDto) {
    const template = await this.prisma.template.findUnique({ where: { id: dto.templateId } });
    if (!template || template.status !== "PUBLISHED") {
      throw new NotFoundException("TEMPLATE_NOT_FOUND");
    }

    // TODO: enqueue a `document-generation` BullMQ job (docs/trd.md Section 4.2)
    // that runs docxtemplater + LibreOffice and uploads the result to R2. The
    // job writes `fileUrl` back onto this row when it completes — for now the
    // row is created in GENERATED status with a placeholder fileUrl.
    return this.prisma.generatedDocument.create({
      data: {
        userId,
        templateId: dto.templateId,
        filledData: dto.filledData as object,
        fileUrl: "", // set by the generation job
        status: "GENERATED",
      },
    });
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
  async consumeDownload(documentId: string, requesterId: string, requesterRole: Role) {
    const doc = await this.prisma.generatedDocument.findUnique({ where: { id: documentId } });
    if (!doc) throw new NotFoundException("DOCUMENT_NOT_FOUND");
    if (doc.userId !== requesterId && requesterRole === ("customer" as Role)) {
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

  /** Called by PaymentsService once a document-review order is confirmed paid. */
  async queueReview(generatedDocumentId: string, requestedByUserId: string, orderId: string) {
    return this.prisma.documentReview.create({
      data: { generatedDocumentId, requestedByUserId, orderId, status: "QUEUED" },
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

  async returnReview(reviewId: string, reviewedFileUrl: string, notes?: string) {
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
      include: { generatedDocument: { include: { template: { select: { title: true } } } } },
    });
  }
}
