import { InjectQueue } from "@nestjs/bullmq";
import {
  BadRequestException,
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
import { NotificationSender } from "../notifications/notification-sender.service";
import { StorageService } from "../storage/storage.service";

import type { DocumentGenerationJobData } from "./document-generation.processor";
import { GenerateDocumentDto } from "./dto/generate-document.dto";
import { UpsertTemplateDto } from "./dto/upsert-template.dto";
import { applyTags, extractBlanks, suggestFieldName } from "./tagging/blanks";
import { guessFieldType } from "./tagging/field-type";

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationSender,
    private readonly storage: StorageService,
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

  /**
   * The customer's own documents, for their dashboard.
   *
   * Includes the template's prices because a document generated earlier is
   * commonly paid for later, and quoting a price needs no extra round trip per
   * row. fileUrl comes back too — harmless, since it's now a storage key that
   * cannot be fetched without a signature (see StorageService.signUrl).
   */
  listMine(userId: string) {
    return this.prisma.generatedDocument.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        template: {
          select: { title: true, priceInPaise: true, reviewPriceInPaise: true },
        },
      },
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

    // Signed here rather than stored, so the link dies minutes after the
    // entitlement check that produced it (docs/trd.md Section 8).
    return { fileUrl: this.storage.signUrl(doc.fileUrl) };
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
    return this.prisma.$transaction(async (tx) => {
      // Conditional update, not read-then-write: `assignedToUserId: null` in
      // the WHERE is what makes the claim atomic under concurrent reviewers
      // (docs/trd.md 4.3). Keep it that way.
      const result = await tx.documentReview.updateMany({
        where: { id: reviewId, assignedToUserId: null },
        data: { assignedToUserId: reviewerId, status: "IN_REVIEW" },
      });
      if (result.count === 0) {
        throw new ForbiddenException("ALREADY_CLAIMED");
      }

      await this.audit.recordWith(tx, {
        actorUserId: reviewerId,
        action: AuditAction.REVIEW_CLAIMED,
        targetType: AuditTargetType.DOCUMENT_REVIEW,
        targetId: reviewId,
      });

      return tx.documentReview.findUnique({ where: { id: reviewId } });
    });
  }

  async returnReview(
    reviewId: string,
    reviewedFileUrl: string,
    actorUserId: string,
    notes?: string,
  ) {
    const returned = await this.prisma.$transaction(async (tx) => {
      const returned = await tx.documentReview.update({
        where: { id: reviewId },
        data: { status: "RETURNED", reviewedFileUrl, notes },
      });

      await this.audit.recordWith(tx, {
        actorUserId,
        action: AuditAction.REVIEW_RETURNED,
        targetType: AuditTargetType.DOCUMENT_REVIEW,
        targetId: reviewId,
        metadata: { generatedDocumentId: returned.generatedDocumentId },
      });

      return returned;
    });

    // Outside the transaction, and deliberately after it commits: the review
    // is returned whether or not the customer can be reached, and a mail
    // provider having a bad minute must not roll back a reviewer's work.
    //
    // Email only for now. The Android push confirmed in docs/srs.md 3.8
    // arrives with the app (Milestone 5) and routes through the same queue.
    await this.notifyReviewReady(reviewId);
    return returned;
  }

  private async notifyReviewReady(reviewId: string) {
    const review = await this.prisma.documentReview.findUnique({
      where: { id: reviewId },
      include: {
        requestedBy: { select: { name: true, email: true } },
        generatedDocument: {
          include: { template: { select: { title: true } } },
        },
      },
    });
    if (!review?.requestedBy.email) return;

    await this.notifications.send({
      type: "review-ready",
      to: review.requestedBy.email,
      payload: {
        customerName: review.requestedBy.name,
        documentTitle: review.generatedDocument.template.title,
      },
    });
  }

  /**
   * The blanks in a stored .docx, ready to be named.
   *
   * Reads the file that is already in the bucket rather than asking for an
   * upload — the catalogue was loaded there directly, and a second copy would
   * drift from the one being sold.
   */
  async readBlanks(storageKey: string) {
    const file = await this.storage.read(storageKey);
    const blanks = extractBlanks(file);
    return {
      storageKey,
      blanks: blanks.map((blank) => ({
        ...blank,
        suggestedField: suggestFieldName(blank),
        suggestedType: guessFieldType(blank),
      })),
    };
  }

  /**
   * Writes a tagged copy of a stored form and registers it as a Template.
   *
   * The tagged file is saved beside the original under templates/, never over
   * it: the untagged version is still being sold as a download, and the two
   * have different jobs.
   *
   * Created as DRAFT regardless of what the caller asks. A template drives a
   * paid document for a real customer, and the person who named the fields
   * should see one generated before it is on sale.
   */
  async createTemplateFromStorage(
    input: {
      storageKey: string;
      title: string;
      category: string;
      priceInPaise: number;
      reviewPriceInPaise: number;
      fields: {
        index: number;
        key: string;
        label: string;
        type: string;
        required: boolean;
      }[];
    },
    actorUserId: string,
  ) {
    const duplicates = input.fields
      .map((f) => f.key)
      .filter((key, i, all) => all.indexOf(key) !== i);
    if (duplicates.length > 0) {
      // Two blanks sharing a key would silently fill with the same value —
      // a landlord and a tenant with the same name, and nothing to show for
      // it but a document that reads oddly.
      throw new BadRequestException(
        `Duplicate field keys: ${[...new Set(duplicates)].join(", ")}`,
      );
    }

    const source = await this.storage.read(input.storageKey);
    const tagged = applyTags(
      source,
      input.fields.map((f) => ({ index: f.index, field: f.key })),
    );

    const taggedKey = `templates/${Date.now()}-${input.storageKey
      .split("/")
      .pop()}`;
    await this.storage.upload(
      taggedKey,
      tagged,
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );

    return this.prisma.$transaction(async (tx) => {
      const template = await tx.template.create({
        data: {
          title: input.title,
          category: input.category,
          priceInPaise: input.priceInPaise,
          reviewPriceInPaise: input.reviewPriceInPaise,
          fieldSchema: input.fields.map((f) => ({
            key: f.key,
            label: f.label,
            type: f.type,
            required: f.required,
          })),
          templateFileKey: taggedKey,
          status: "DRAFT",
          createdBy: actorUserId,
        },
      });

      await this.audit.recordWith(tx, {
        actorUserId,
        action: AuditAction.TEMPLATE_CREATED,
        targetType: AuditTargetType.TEMPLATE,
        targetId: template.id,
        metadata: {
          taggedFromStorage: input.storageKey,
          fieldCount: input.fields.length,
        },
      });

      return template;
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
