import { InjectQueue } from "@nestjs/bullmq";
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { Role } from "@pratikar/types";
import type { Prisma } from "@prisma/client";
import type { Queue } from "bullmq";

import { convertToPdf } from "../../common/office/convert-to-pdf";
import { previewPageKey } from "../../common/office/preview";
import { PrismaService } from "../../prisma/prisma.service";
import type { DocumentDraft, DraftBrief } from "../ai/drafting/draft-prompt";
import { DraftingService } from "../ai/drafting/drafting.service";
import { KnowledgeBaseIndexer } from "../ai/knowledge-base/knowledge-base-indexer.service";
import {
  AuditAction,
  AuditService,
  AuditTargetType,
} from "../audit/audit.service";
import {
  folderOf,
  isAppWritten,
  titleFromKey,
} from "../content-library/catalogue";
import { NotificationSender } from "../notifications/notification-sender.service";
import { UserNotifier } from "../notifications/user-notifier.service";
import { StorageService } from "../storage/storage.service";

import {
  customDraftReviewPrice,
  documentTitle,
  MAX_DRAFT_REVISIONS,
  MAX_DRAFTS_PER_DAY,
} from "./custom-draft";
import type { DocumentGenerationJobData } from "./document-generation.processor";
import type { DraftCustomDto } from "./dto/draft-custom.dto";
import { GenerateDocumentDto } from "./dto/generate-document.dto";
import type { ReturnReviewDto } from "./dto/return-review.dto";
import { UpsertTemplateDto } from "./dto/upsert-template.dto";
import { fieldsOf, validateAnswers } from "./filled-data";
import { applyTags, extractBlanks, suggestFieldName } from "./tagging/blanks";
import { guessFieldType, labelFor } from "./tagging/field-type";

/**
 * What a visitor may see about a template. A whitelist, as in the content
 * library: a column added later stays private until someone decides it
 * belongs on the storefront. Matches the Template type in @pratikar/types.
 */
const CATALOGUE_TEMPLATE_FIELDS = {
  id: true,
  title: true,
  category: true,
  priceInPaise: true,
  reviewPriceInPaise: true,
  fieldSchema: true,
  status: true,
  createdAt: true,
} as const;

/**
 * Preview page links last long enough to read a long agreement through. They
 * are watermarked images, not the document, so a longer life costs nothing.
 */
const PREVIEW_URL_TTL_MS = 30 * 60_000;

/** Reviewed files an advocate may upload: Word or PDF, up to 15 MB. */
export const REVIEWED_FILE_TYPES: Record<string, string> = {
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".pdf": "application/pdf",
};
export const MAX_REVIEWED_FILE_BYTES = 15 * 1024 * 1024;

/** A file as Nest's FileInterceptor hands it over (multer, in memory). */
export interface UploadedReviewFile {
  originalname: string;
  size: number;
  buffer: Buffer;
}

/** Reviews still being worked on — a second one can't be bought meanwhile. */
const ACTIVE_REVIEW = ["QUEUED", "IN_REVIEW"] as const;

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationSender,
    private readonly storage: StorageService,
    @InjectQueue("document-generation")
    private readonly documentGenerationQueue: Queue<DocumentGenerationJobData>,
    private readonly knowledgeBase: KnowledgeBaseIndexer,
    private readonly drafting: DraftingService,
    private readonly notifier: UserNotifier,
  ) {}

  /**
   * The customer-facing catalogue. Selects columns rather than returning the
   * row, because this is public: templateFileKey is where the paid-for source
   * document lives, and createdBy is a staff member's id.
   */
  listPublishedTemplates() {
    return this.prisma.template.findMany({
      where: { status: "PUBLISHED" },
      select: CATALOGUE_TEMPLATE_FIELDS,
      orderBy: { createdAt: "desc" },
    });
  }

  /** One template for its public page, with the same exclusions. */
  async getPublishedTemplate(templateId: string) {
    const template = await this.prisma.template.findFirst({
      where: { id: templateId, status: "PUBLISHED" },
      select: CATALOGUE_TEMPLATE_FIELDS,
    });
    if (!template) throw new NotFoundException("TEMPLATE_NOT_FOUND");
    return template;
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
    const template = await this.prisma.$transaction(async (tx) => {
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

    // After the commit, so the worker reads the row as saved.
    await this.knowledgeBase.reindex({
      sourceType: "template",
      sourceId: template.id,
    });
    return template;
  }

  async generate(userId: string, dto: GenerateDocumentDto) {
    const template = await this.prisma.template.findUnique({
      where: { id: dto.templateId },
    });
    if (!template || template.status !== "PUBLISHED") {
      throw new NotFoundException("TEMPLATE_NOT_FOUND");
    }

    // Checked here whichever way the answers were collected — the form or
    // the AI generator — and only the cleaned answers are stored. A document
    // with a missing or malformed field is refused before it exists.
    const { clean, problems } = validateAnswers(
      fieldsOf(template.fieldSchema),
      dto.filledData,
    );
    if (problems.length > 0) {
      throw new BadRequestException({ message: "INVALID_ANSWERS", problems });
    }

    const generatedDocument = await this.prisma.generatedDocument.create({
      data: {
        userId,
        templateId: dto.templateId,
        filledData: clean,
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

  /** What a custom draft costs: the advocate review, which unlocks it. */
  customPricing() {
    return {
      available: this.drafting.isConfigured,
      reviewPriceInPaise: customDraftReviewPrice(),
      maxRevisions: MAX_DRAFT_REVISIONS,
    };
  }

  /**
   * Starts a custom document: the AI drafts it from the customer's own
   * description, in the background. The draft is free to preview; it can
   * only be downloaded once an advocate has reviewed it (consumeDownload).
   */
  async draftCustom(userId: string, dto: DraftCustomDto) {
    if (!this.drafting.isConfigured) {
      throw new ServiceUnavailableException("AI_NOT_CONFIGURED");
    }

    // Each draft is a paid model call, so a day's worth is capped.
    const since = new Date(Date.now() - 24 * 3600_000);
    const today = await this.prisma.generatedDocument.count({
      where: { userId, kind: "CUSTOM", createdAt: { gte: since } },
    });
    if (today >= MAX_DRAFTS_PER_DAY) {
      throw new HttpException(
        "DRAFT_LIMIT_REACHED",
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const brief: DraftBrief = {
      documentType: dto.documentType.trim(),
      details: dto.details.trim(),
      stateCode: dto.stateCode ?? null,
    };
    const doc = await this.prisma.generatedDocument.create({
      data: {
        userId,
        kind: "CUSTOM",
        title: brief.documentType,
        brief: brief as unknown as Prisma.InputJsonValue,
        filledData: {},
        fileUrl: "",
        status: "GENERATED",
      },
    });
    await this.documentGenerationQueue.add("draft", {
      generatedDocumentId: doc.id,
    });
    return { id: doc.id };
  }

  /**
   * Redrafts a custom document with the customer's change. Only while it's
   * still theirs to change — once a review is bought, the advocate is
   * working from this draft and it must hold still.
   */
  async reviseCustom(documentId: string, userId: string, instruction: string) {
    if (!this.drafting.isConfigured) {
      throw new ServiceUnavailableException("AI_NOT_CONFIGURED");
    }
    const doc = await this.prisma.generatedDocument.findUnique({
      where: { id: documentId },
      include: { reviews: { where: { status: { not: "CANCELLED" } } } },
    });
    if (!doc || doc.userId !== userId || doc.kind !== "CUSTOM") {
      throw new NotFoundException("DOCUMENT_NOT_FOUND");
    }
    if (doc.reviews.length > 0) {
      throw new ConflictException("UNDER_REVIEW");
    }
    if (!doc.fileUrl || !doc.draft) {
      throw new ConflictException("NOT_READY");
    }
    if (doc.revisionCount >= MAX_DRAFT_REVISIONS) {
      throw new ConflictException("REVISION_LIMIT_REACHED");
    }

    // Conditional on the count read above, so two quick clicks can't both
    // start a revision of the same draft.
    const claimed = await this.prisma.generatedDocument.updateMany({
      where: {
        id: doc.id,
        revisionCount: doc.revisionCount,
        fileUrl: { not: "" },
      },
      data: {
        revisionCount: { increment: 1 },
        fileUrl: "",
        draftError: null,
      },
    });
    if (claimed.count === 0) throw new ConflictException("NOT_READY");

    await this.documentGenerationQueue.add("draft", {
      generatedDocumentId: doc.id,
      instruction: instruction.trim(),
    });
    return { id: doc.id };
  }

  /**
   * One of the customer's documents, with everything its page shows: the
   * draft's summary and blanks, the latest review, and what a review costs.
   */
  async getMine(documentId: string, userId: string) {
    const doc = await this.prisma.generatedDocument.findUnique({
      where: { id: documentId },
      include: {
        template: {
          select: { title: true, priceInPaise: true, reviewPriceInPaise: true },
        },
        reviews: {
          where: { status: { not: "CANCELLED" } },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            status: true,
            notes: true,
            createdAt: true,
            returnedAt: true,
            reviewedPdfUrl: true,
          },
        },
      },
    });
    if (!doc || doc.userId !== userId) {
      throw new NotFoundException("DOCUMENT_NOT_FOUND");
    }
    return this.toCustomerView(doc);
  }

  /** The shape the customer's pages read: one title, one review price, no storage keys. */
  private toCustomerView<
    D extends {
      id: string;
      kind: "TEMPLATE" | "CUSTOM";
      title: string | null;
      draft: unknown;
      brief: unknown;
      template: {
        title: string;
        priceInPaise: number;
        reviewPriceInPaise: number;
      } | null;
      reviews: {
        id: string;
        status: string;
        notes: string | null;
        createdAt: Date;
        returnedAt: Date | null;
        reviewedPdfUrl: string | null;
      }[];
      fileUrl: string;
      pdfFileUrl: string | null;
    },
  >(doc: D) {
    const draft = doc.draft as DocumentDraft | null;
    // Storage keys stay on the server; the draft is summarised below.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- named only to be left out
    const { reviews, fileUrl, pdfFileUrl: _pdf, draft: _draft, ...rest } = doc;
    const review = reviews[0] ?? null;
    return {
      ...rest,
      title: documentTitle(doc),
      ready: fileUrl !== "",
      priceInPaise: doc.template?.priceInPaise ?? null,
      reviewPriceInPaise:
        doc.template?.reviewPriceInPaise ?? customDraftReviewPrice(),
      summary: draft?.summary ?? null,
      missingDetails: draft?.missingDetails ?? [],
      review: review && {
        id: review.id,
        status: review.status,
        notes: review.status === "RETURNED" ? review.notes : null,
        createdAt: review.createdAt,
        returnedAt: review.returnedAt,
        hasPdf: review.reviewedPdfUrl !== null,
      },
    };
  }

  /**
   * The customer's own documents, for their dashboard.
   *
   * Includes the template's prices because a document generated earlier is
   * commonly paid for later, and quoting a price needs no extra round trip per
   * row. fileUrl comes back too — harmless, since it's now a storage key that
   * cannot be fetched without a signature (see StorageService.signUrl).
   */
  async listMine(userId: string) {
    const docs = await this.prisma.generatedDocument.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        template: {
          select: { title: true, priceInPaise: true, reviewPriceInPaise: true },
        },
        reviews: {
          where: { status: { not: "CANCELLED" } },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            status: true,
            notes: true,
            createdAt: true,
            returnedAt: true,
            reviewedPdfUrl: true,
          },
        },
      },
    });
    return docs.map((doc) => this.toCustomerView(doc));
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
    // A custom draft has had no lawyer near it until it's reviewed; the
    // reviewed copy is what's downloaded (reviewedDownload), never this.
    if (doc.kind === "CUSTOM") {
      throw new ForbiddenException("REVIEW_REQUIRED");
    }
    if (doc.status === "DOWNLOADED") {
      throw new ForbiddenException("ALREADY_DOWNLOADED");
    }
    if (doc.status !== "PAID") {
      throw new ForbiddenException("NOT_PAID");
    }
    // Paid before the worker finished: there's no file yet. Refusing keeps
    // the one-time download unspent — consuming it here would sign a link
    // to nothing and leave the customer with a paid document they can never
    // download.
    if (!doc.fileUrl) {
      throw new ConflictException("NOT_READY");
    }

    await this.prisma.generatedDocument.update({
      where: { id: documentId },
      data: { status: "DOWNLOADED", downloadedAt: new Date() },
    });

    // Signed here rather than stored, so the links die minutes after the
    // entitlement check that produced them (docs/trd.md Section 8). Both
    // files in one go: the download is spent the moment this returns.
    return {
      fileUrl: this.storage.signUrl(doc.fileUrl),
      pdfUrl: doc.pdfFileUrl ? this.storage.signUrl(doc.pdfFileUrl) : null,
    };
  }

  /**
   * The free, watermarked preview of a generated document (docs/srs.md 3.2
   * step 3): links to its page images, for the owner — or staff — only. A
   * document's answers are someone's personal details.
   *
   * `ready` is false while the generation worker is still running, so the
   * page can wait for it rather than show an empty preview.
   */
  async getPreview(
    documentId: string,
    requesterId: string,
    requesterRole: Role,
  ) {
    const doc = await this.prisma.generatedDocument.findUnique({
      where: { id: documentId },
      select: {
        id: true,
        userId: true,
        fileUrl: true,
        previewPageCount: true,
        draftError: true,
      },
    });
    if (!doc) throw new NotFoundException("DOCUMENT_NOT_FOUND");
    if (doc.userId !== requesterId && requesterRole === Role.CUSTOMER) {
      throw new ForbiddenException("NOT_YOUR_DOCUMENT");
    }
    // `error` is why a custom draft failed, in words for the customer. With
    // no file it means drafting stopped; with one, a revision failed and the
    // previous draft is what's shown.
    if (!doc.fileUrl) {
      return { ready: false, pages: [] as string[], error: doc.draftError };
    }

    return {
      ready: true,
      error: doc.draftError,
      pages: Array.from({ length: doc.previewPageCount }, (_, i) =>
        this.storage.signUrl(previewPageKey(doc.id, i + 1), PREVIEW_URL_TTL_MS),
      ),
    };
  }

  /** Called by PaymentsService once a document-review order is confirmed paid. */
  async queueReview(
    generatedDocumentId: string,
    requestedByUserId: string,
    orderId: string,
  ) {
    const review = await this.prisma.documentReview.create({
      data: {
        generatedDocumentId,
        requestedByUserId,
        orderId,
        status: "QUEUED",
      },
    });
    await this.alertStaffOfReview(review.id);
    await this.notifier.notifyUser(requestedByUserId, {
      title: "Sent for advocate review",
      body: "An advocate will review your document. We'll let you know the moment it's ready to download.",
      href: `/dashboard/documents/${generatedDocumentId}`,
    });
    return review;
  }

  /**
   * The reviewed document, for its owner: signed links to the advocate's
   * file and its PDF. Unlike the one-time template download, these can be
   * fetched again — it's the customer's own document, reviewed for them.
   */
  async reviewedDownload(documentId: string, userId: string) {
    const review = await this.prisma.documentReview.findFirst({
      where: {
        generatedDocumentId: documentId,
        status: "RETURNED",
        generatedDocument: { userId },
      },
      orderBy: { returnedAt: "desc" },
    });
    if (!review?.reviewedFileUrl) {
      throw new NotFoundException("NO_REVIEWED_FILE");
    }
    return {
      fileUrl: this.storage.signUrl(review.reviewedFileUrl),
      pdfUrl:
        review.reviewedPdfUrl &&
        review.reviewedPdfUrl !== review.reviewedFileUrl
          ? this.storage.signUrl(review.reviewedPdfUrl)
          : null,
    };
  }

  /**
   * What a reviewer needs to do the review: the customer's document as Word
   * and PDF, and what it was made from — the brief for a custom draft, the
   * answers for a template. Staff only, at the controller.
   */
  async reviewFiles(reviewId: string) {
    const review = await this.prisma.documentReview.findUnique({
      where: { id: reviewId },
      include: { generatedDocument: { include: { template: true } } },
    });
    if (!review) throw new NotFoundException("REVIEW_NOT_FOUND");
    const doc = review.generatedDocument;
    const draft = doc.draft as DocumentDraft | null;
    return {
      title: documentTitle(doc),
      kind: doc.kind,
      brief: doc.brief,
      filledData: doc.kind === "TEMPLATE" ? doc.filledData : null,
      missingDetails: draft?.missingDetails ?? [],
      docxUrl: doc.fileUrl ? this.storage.signUrl(doc.fileUrl) : null,
      pdfUrl: doc.pdfFileUrl ? this.storage.signUrl(doc.pdfFileUrl) : null,
    };
  }

  /**
   * Stores the advocate's reviewed file under reviews/<id>/ and returns its
   * key, for returnReview. Only the reviewer who claimed it may upload.
   */
  async uploadReviewedFile(
    reviewId: string,
    reviewerId: string,
    file: UploadedReviewFile | undefined,
  ) {
    if (!file) throw new BadRequestException("FILE_REQUIRED");
    const ext = (/\.[a-z]+$/i.exec(file.originalname)?.[0] ?? "").toLowerCase();
    const contentType = REVIEWED_FILE_TYPES[ext];
    if (!contentType) throw new BadRequestException("WORD_OR_PDF_ONLY");
    if (file.size > MAX_REVIEWED_FILE_BYTES) {
      throw new BadRequestException("FILE_TOO_LARGE");
    }
    await this.assertReviewer(reviewId, reviewerId);

    const key = `reviews/${reviewId}/reviewed-${Date.now()}${ext}`;
    await this.storage.upload(key, file.buffer, contentType);
    return { key };
  }

  /** The review exists, is in progress, and is this reviewer's. */
  private async assertReviewer(reviewId: string, reviewerId: string) {
    const review = await this.prisma.documentReview.findUnique({
      where: { id: reviewId },
      include: { generatedDocument: true },
    });
    if (!review) throw new NotFoundException("REVIEW_NOT_FOUND");
    if (review.status !== "IN_REVIEW") {
      throw new ConflictException("REVIEW_NOT_IN_PROGRESS");
    }
    if (review.assignedToUserId !== reviewerId) {
      throw new ForbiddenException("NOT_YOUR_REVIEW");
    }
    return review;
  }

  /**
   * Tells the team a review is waiting — the queue only helps if someone
   * looks at it. Never throws: the review is queued and paid for either way.
   */
  private async alertStaffOfReview(reviewId: string) {
    try {
      const review = await this.prisma.documentReview.findUnique({
        where: { id: reviewId },
        select: {
          requestedBy: { select: { name: true } },
          generatedDocument: {
            select: { title: true, template: { select: { title: true } } },
          },
        },
      });
      if (!review) return;
      await this.notifications.sendToStaff((to) => ({
        type: "staff-review-requested",
        to,
        payload: {
          customerName: review.requestedBy.name,
          documentTitle: documentTitle(review.generatedDocument),
        },
      }));
    } catch (error) {
      this.logger.error(
        `Review ${reviewId} queued, but the staff alert was not: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
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

  /**
   * Sends a review back to the customer, which is what unlocks a custom
   * draft for download. The reviewer either uploads their reviewed file
   * (uploadReviewedFile, then its key here) or approves the draft as it
   * stands, in which case the drafted files are the reviewed ones.
   */
  async returnReview(
    reviewId: string,
    dto: Pick<
      ReturnReviewDto,
      "reviewedFileUrl" | "approveAsDrafted" | "notes"
    >,
    actorUserId: string,
  ) {
    const review = await this.assertReviewer(reviewId, actorUserId);
    const doc = review.generatedDocument;

    let reviewedFileUrl: string;
    let reviewedPdfUrl: string | null;
    if (dto.approveAsDrafted) {
      if (!doc.fileUrl) throw new ConflictException("NOT_READY");
      reviewedFileUrl = doc.fileUrl;
      reviewedPdfUrl = doc.pdfFileUrl;
    } else {
      // Only a file uploaded for this review. A free-typed key could hand the
      // customer any object in the bucket — someone else's document included.
      const key = dto.reviewedFileUrl ?? "";
      if (!key.startsWith(`reviews/${reviewId}/`)) {
        throw new BadRequestException("UPLOAD_THE_REVIEWED_FILE");
      }
      reviewedFileUrl = key;
      reviewedPdfUrl = await this.pdfOfReviewedFile(key);
    }

    const returned = await this.prisma.$transaction(async (tx) => {
      const returned = await tx.documentReview.update({
        where: { id: reviewId },
        data: {
          status: "RETURNED",
          reviewedFileUrl,
          reviewedPdfUrl,
          notes: dto.notes?.trim() || null,
          returnedAt: new Date(),
        },
      });

      await this.audit.recordWith(tx, {
        actorUserId,
        action: AuditAction.REVIEW_RETURNED,
        targetType: AuditTargetType.DOCUMENT_REVIEW,
        targetId: reviewId,
        metadata: {
          generatedDocumentId: returned.generatedDocumentId,
          approvedAsDrafted: Boolean(dto.approveAsDrafted),
        },
      });

      return returned;
    });

    // Outside the transaction, and deliberately after it commits: the review
    // is returned whether or not the customer can be reached, and a mail
    // provider having a bad minute must not roll back a reviewer's work.
    await this.notifyReviewReady(reviewId);
    return returned;
  }

  /**
   * A PDF of the reviewer's file: the file itself when it is one, otherwise
   * converted. Null if conversion fails — the Word file is still the
   * reviewed document, and the customer can download that.
   */
  private async pdfOfReviewedFile(key: string): Promise<string | null> {
    if (key.toLowerCase().endsWith(".pdf")) return key;
    try {
      const pdf = await convertToPdf(await this.storage.read(key), ".docx");
      const pdfKey = key.replace(/\.docx$/i, ".pdf");
      await this.storage.upload(pdfKey, pdf, "application/pdf");
      return pdfKey;
    } catch (error) {
      this.logger.warn(
        `No PDF for reviewed file ${key}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  /**
   * "Your document is ready" — on every channel: the inbox, browser push,
   * email, and SMS, because this is the message a customer is waiting for.
   */
  private async notifyReviewReady(reviewId: string) {
    const review = await this.prisma.documentReview.findUnique({
      where: { id: reviewId },
      include: {
        requestedBy: { select: { name: true } },
        generatedDocument: {
          include: { template: { select: { title: true } } },
        },
      },
    });
    if (!review) return;

    const title = documentTitle(review.generatedDocument);
    await this.notifier.notifyUser(review.requestedByUserId, {
      title: "Your document is ready to download",
      body: `An advocate has reviewed “${title}”. Tap to download it.`,
      href: `/dashboard/documents/${review.generatedDocumentId}`,
      email: {
        type: "review-ready",
        payload: {
          customerName: review.requestedBy.name,
          documentTitle: title,
          documentId: review.generatedDocumentId,
        },
      },
      sms: {
        template: "document-ready",
        variables: { title: title.slice(0, 30) },
      },
    });
  }

  /**
   * The forms in storage that could become templates, with the one already
   * built from each, when there is one.
   *
   * Only .docx: a blank is found by reading the document's XML, so a PDF or a
   * scan has nothing this can act on. They are counted rather than dropped
   * silently, so the screen can say why the bucket looks smaller than it is.
   *
   * Files the app wrote itself are left out entirely, not counted as skipped:
   * a customer's generated document is a .docx with their details in it, and
   * a tagged copy has no blanks left to name.
   *
   * `template` is not a warning — building a second template from the same
   * form is legitimate (a short version and a long one). It is there so the
   * operator sees they are about to repeat work, which is the far more likely
   * reading of the same file being picked twice.
   */
  async listTaggableStorage(prefix?: string) {
    const [stored, tagged] = await Promise.all([
      this.storage.list(prefix ?? ""),
      this.prisma.template.findMany({
        where: { sourceKey: { not: null } },
        select: { id: true, title: true, sourceKey: true, status: true },
      }),
    ]);

    const bySource = new Map(
      tagged.map((row) => [
        row.sourceKey as string,
        { id: row.id, title: row.title, status: row.status },
      ]),
    );

    const objects = stored.filter((object) => !isAppWritten(object.key));
    const docx = objects.filter((object) =>
      object.key.toLowerCase().endsWith(".docx"),
    );

    return {
      totalObjects: objects.length,
      skippedUnsupported: objects.length - docx.length,
      objects: docx
        .map((object) => ({
          key: object.key,
          sizeInBytes: object.sizeInBytes,
          lastModified: object.lastModified,
          folder: folderOf(object.key),
          suggestedTitle: titleFromKey(object.key),
          template: bySource.get(object.key) ?? null,
        }))
        .sort((a, b) => a.key.localeCompare(b.key)),
    };
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
      blanks: blanks.map((blank) => {
        const suggestedField = suggestFieldName(blank);
        return {
          ...blank,
          suggestedField,
          // The label is derived here rather than in the browser so the two
          // stay one rule: labelFor is already the tested one.
          suggestedLabel: labelFor(suggestedField),
          suggestedType: guessFieldType(blank),
        };
      }),
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
          sourceKey: input.storageKey,
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
      where: { status: { in: [...ACTIVE_REVIEW] } },
      orderBy: { createdAt: "asc" },
      include: {
        generatedDocument: {
          select: {
            id: true,
            kind: true,
            title: true,
            template: { select: { title: true } },
          },
        },
      },
    });
  }
}
