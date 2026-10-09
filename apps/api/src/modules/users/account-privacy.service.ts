import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { previewPageKey } from "../../common/office/preview";
import { PrismaService } from "../../prisma/prisma.service";
import {
  AuditAction,
  AuditService,
  AuditTargetType,
} from "../audit/audit.service";
import { StorageService } from "../storage/storage.service";

/**
 * How long a pending order blocks erasure. Razorpay can confirm a payment a
 * few minutes after checkout opens; erasing in that window would leave a
 * paid order on an account nobody can sign in to. Older pending orders were
 * abandoned.
 */
const PENDING_PAYMENT_WINDOW_MS = 60 * 60_000;

/** Preview pages a document can have — the most the worker renders. */
const MAX_PREVIEW_PAGES = 12;

/**
 * The customer's rights over their data under the Digital Personal Data
 * Protection Act, 2023, as the privacy policy promises them — self-service,
 * rather than an email to the Grievance Officer:
 *
 *   s11  a summary of the personal data held   → exportData
 *   s12  erasure, except what law requires us  → deleteAccount
 *        to keep
 *
 * What the law requires us to keep is the tax record: orders, invoices and
 * credit notes (CGST Act s36 — six years from the annual return, in
 * practice eight). They stay, attached to an account with no name, address,
 * email or phone left on it.
 */
@Injectable()
export class AccountPrivacyService {
  private readonly logger = new Logger(AccountPrivacyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly storage: StorageService,
  ) {}

  /**
   * Everything personal we hold about the customer, as one JSON document.
   * Storage keys, password-like values and other customers' data are left
   * out; what each row *says* about them is in.
   */
  async exportData(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        addressLine: true,
        city: true,
        stateCode: true,
        pincode: true,
        createdAt: true,
        deletedAt: true,
      },
    });
    if (!user || user.deletedAt) throw new NotFoundException("USER_NOT_FOUND");

    const [
      sessions,
      orders,
      documents,
      enrollments,
      notifications,
      pushDevices,
    ] = await Promise.all([
      this.prisma.session.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: {
          createdAt: true,
          expiresAt: true,
          revokedAt: true,
          userAgent: true,
          ip: true,
        },
      }),
      this.prisma.order.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          itemType: true,
          amount: true,
          gstAmount: true,
          status: true,
          createdAt: true,
          invoice: { select: { invoiceNumber: true, createdAt: true } },
          creditNote: { select: { noteNumber: true, createdAt: true } },
        },
      }),
      this.prisma.generatedDocument.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          kind: true,
          title: true,
          status: true,
          createdAt: true,
          downloadedAt: true,
          filledData: true,
          brief: true,
          template: { select: { title: true } },
          reviews: {
            select: {
              status: true,
              notes: true,
              createdAt: true,
              returnedAt: true,
            },
          },
        },
      }),
      this.prisma.enrollment.findMany({
        where: { userId },
        select: {
          enrolledAt: true,
          expiresAt: true,
          completedAt: true,
          course: { select: { title: true } },
          certificate: {
            select: {
              verificationCode: true,
              issuedAt: true,
              scorePercent: true,
            },
          },
          _count: { select: { progress: true } },
        },
      }),
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: { title: true, body: true, createdAt: true, readAt: true },
      }),
      this.prisma.pushSubscription.findMany({
        where: { userId },
        select: { userAgent: true, createdAt: true },
      }),
    ]);

    return {
      exportedAt: new Date().toISOString(),
      account: user,
      signIns: sessions,
      orders,
      documents: documents.map(({ template, ...doc }) => ({
        ...doc,
        title: template?.title ?? doc.title,
      })),
      courses: enrollments.map(({ _count, ...enrollment }) => ({
        ...enrollment,
        lessonsCompleted: _count.progress,
      })),
      notifications,
      notificationDevices: pushDevices,
    };
  }

  /**
   * Erases the account. Everything personal goes; the tax record stays.
   *
   *   cleared   name, email, phone, billing address; every document's
   *             answers, brief and draft, and its files; advocates' notes
   *             and reviewed files; notifications, push devices, sessions,
   *             sign-in codes, assistant conversations
   *   kept      orders, invoices, credit notes (tax law), and course
   *             progress and certificates — no longer linked to a name
   *
   * Refused for staff, whose accounts are managed in the admin panel, and
   * while something paid for is still in motion: an advocate mid-review, or
   * a payment that may yet be confirmed.
   */
  async deleteAccount(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.deletedAt) throw new NotFoundException("USER_NOT_FOUND");
    if (user.role !== "CUSTOMER") {
      throw new ForbiddenException("STAFF_ACCOUNT");
    }

    const [activeReviews, pendingPayments] = await Promise.all([
      this.prisma.documentReview.count({
        where: {
          requestedByUserId: userId,
          status: { in: ["QUEUED", "IN_REVIEW"] },
        },
      }),
      this.prisma.order.count({
        where: {
          userId,
          status: "PENDING",
          createdAt: { gte: new Date(Date.now() - PENDING_PAYMENT_WINDOW_MS) },
        },
      }),
    ]);
    if (activeReviews > 0) throw new ConflictException("REVIEW_IN_PROGRESS");
    if (pendingPayments > 0) throw new ConflictException("PAYMENT_IN_PROGRESS");

    // The files to delete, gathered before the rows forget where they are.
    const documents = await this.prisma.generatedDocument.findMany({
      where: { userId },
      select: {
        id: true,
        fileUrl: true,
        pdfFileUrl: true,
        reviews: {
          select: { id: true, reviewedFileUrl: true, reviewedPdfUrl: true },
        },
      },
    });
    const keys = new Set<string>();
    for (const doc of documents) {
      if (doc.fileUrl) keys.add(doc.fileUrl);
      if (doc.pdfFileUrl) keys.add(doc.pdfFileUrl);
      for (let page = 1; page <= MAX_PREVIEW_PAGES; page++) {
        keys.add(previewPageKey(doc.id, page));
      }
      for (const review of doc.reviews) {
        if (review.reviewedFileUrl) keys.add(review.reviewedFileUrl);
        if (review.reviewedPdfUrl) keys.add(review.reviewedPdfUrl);
      }
    }
    // Only what the app wrote for this customer — never a library form or a
    // template, whatever a row might point at.
    const ownKeys = [...keys].filter(
      (key) => key.startsWith("documents/") || key.startsWith("reviews/"),
    );

    const identifiers = [user.email, user.phone].filter(
      (value): value is string => Boolean(value),
    );
    const documentIds = documents.map((doc) => doc.id);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          name: null,
          email: null,
          phone: null,
          addressLine: null,
          city: null,
          stateCode: null,
          pincode: null,
          deletedAt: new Date(),
        },
      });
      await tx.session.deleteMany({ where: { userId } });
      await tx.pushSubscription.deleteMany({ where: { userId } });
      await tx.notification.deleteMany({ where: { userId } });
      await tx.chatbotConversation.deleteMany({ where: { userId } });
      if (identifiers.length > 0) {
        await tx.otpRequest.deleteMany({
          where: { identifier: { in: identifiers } },
        });
      }
      // The rows stay — orders point at them — but say nothing about anyone.
      await tx.generatedDocument.updateMany({
        where: { userId },
        data: {
          filledData: {},
          brief: Prisma.DbNull,
          draft: Prisma.DbNull,
          draftError: null,
          fileUrl: "",
          pdfFileUrl: null,
          previewPageCount: 0,
        },
      });
      await tx.documentReview.updateMany({
        where: { generatedDocumentId: { in: documentIds } },
        data: { notes: null, reviewedFileUrl: null, reviewedPdfUrl: null },
      });
      await this.audit.recordWith(tx, {
        actorUserId: userId,
        action: AuditAction.ACCOUNT_DELETED,
        targetType: AuditTargetType.USER,
        targetId: userId,
        metadata: { documents: documentIds.length, files: ownKeys.length },
      });
    });

    // After the commit: the account is erased whether or not every file
    // delete succeeds, and a leftover file is logged to clean up by hand.
    const failed: string[] = [];
    for (const key of ownKeys) {
      try {
        await this.storage.remove(key);
      } catch {
        failed.push(key);
      }
    }
    if (failed.length > 0) {
      this.logger.error(
        `Account ${userId} erased, but ${failed.length} files were not: ${failed.join(", ")}`,
      );
    }
  }
}
