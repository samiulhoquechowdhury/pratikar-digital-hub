import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service";
import {
  AuditAction,
  AuditService,
  AuditTargetType,
} from "../audit/audit.service";
import { DocumentsService } from "../documents/documents.service";
import { LmsService } from "../lms/lms.service";

import { CreateOrderDto } from "./dto/create-order.dto";
import { RazorpayService } from "./razorpay.service";

// GST rate is a placeholder — the actual applicable rate depends on how these
// digital goods/services get classified, which is an accounting/legal
// question, not an engineering one. Confirm with the client/their accountant
// before this touches real invoices (docs/srs.md Section 8 territory).
const GST_RATE = 0.18;

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly razorpay: RazorpayService,
    private readonly documentsService: DocumentsService,
    private readonly lmsService: LmsService,
    private readonly audit: AuditService,
  ) {}

  async createOrder(userId: string, dto: CreateOrderDto) {
    const amount = await this.resolveAmount(dto.itemType, dto.itemId);
    const gstAmount = Math.round(amount * GST_RATE);

    const order = await this.prisma.order.create({
      data: {
        userId,
        itemType: dto.itemType,
        amount,
        gstAmount,
        status: "PENDING",
        ...this.itemFkFor(dto.itemType, dto.itemId),
      },
    });

    const razorpayOrder = await this.razorpay.createOrder(
      amount + gstAmount,
      order.id,
    );

    return this.prisma.order.update({
      where: { id: order.id },
      data: { razorpayOrderId: razorpayOrder.id },
    });
  }

  /**
   * Webhook handler — the ONLY place an order moves to PAID. Never trust a
   * client-reported success callback (docs/trd.md Section 4.4).
   */
  async handleWebhook(
    rawBody: string,
    signature: string,
    payload: {
      razorpayOrderId: string;
      razorpayPaymentId: string;
      event: "payment.captured" | "payment.failed";
    },
  ) {
    if (!this.razorpay.verifyWebhookSignature(rawBody, signature)) {
      throw new ForbiddenException("INVALID_WEBHOOK_SIGNATURE");
    }

    const order = await this.prisma.order.findUnique({
      where: { razorpayOrderId: payload.razorpayOrderId },
    });
    if (!order) throw new NotFoundException("ORDER_NOT_FOUND");

    if (payload.event === "payment.failed") {
      await this.prisma.order.update({
        where: { id: order.id },
        data: { status: "FAILED" },
      });
      return;
    }

    await this.prisma.order.update({
      where: { id: order.id },
      data: { status: "PAID", razorpayPaymentId: payload.razorpayPaymentId },
    });

    await this.grantEntitlement(order);
  }

  private async grantEntitlement(order: {
    id: string;
    userId: string;
    itemType: string;
    generatedDocumentId: string | null;
    courseId: string | null;
  }) {
    switch (order.itemType) {
      case "DOCUMENT":
        if (order.generatedDocumentId)
          await this.documentsService.markPaid(order.generatedDocumentId);
        break;
      case "DOCUMENT_REVIEW":
        if (order.generatedDocumentId) {
          await this.documentsService.queueReview(
            order.generatedDocumentId,
            order.userId,
            order.id,
          );
        }
        break;
      case "COURSE":
        if (order.courseId)
          await this.lmsService.enroll(order.userId, order.courseId, order.id);
        break;
      case "CONTENT_ITEM":
        // No separate entitlement row needed — a PAID Order with
        // itemType=CONTENT_ITEM for this user IS the entitlement.
        break;
    }
  }

  /** Order list for the admin screen (docs/implementation-plan.md M2 item 3). */
  listOrders() {
    return this.prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, email: true, phone: true, name: true } },
      },
    });
  }

  /**
   * Admin-direct refund (docs/srs.md Section 7, item 6 — confirmed, no
   * Support-approval step). Reverses the entitlement granted above.
   */
  async refund(orderId: string, actorUserId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new NotFoundException("ORDER_NOT_FOUND");
    if (order.status !== "PAID")
      throw new BadRequestException("ORDER_NOT_REFUNDABLE");
    if (!order.razorpayPaymentId)
      throw new BadRequestException("NO_PAYMENT_TO_REFUND");

    // Razorpay is called before the transaction opens deliberately: it's an
    // external side effect that can't be rolled back, so holding a DB
    // transaction open across it would only widen the window where a lock is
    // held on a network call. The status check above is what prevents a
    // double refund.
    await this.razorpay.refund(
      order.razorpayPaymentId,
      order.amount + order.gstAmount,
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: { status: "REFUNDED" },
      });

      await this.audit.recordWith(tx, {
        actorUserId,
        action: AuditAction.ORDER_REFUNDED,
        targetType: AuditTargetType.ORDER,
        targetId: order.id,
        // Money moved on someone's authority — the amount and who owned the
        // order are exactly what a dispute would need to reconstruct.
        metadata: {
          refundedToUserId: order.userId,
          itemType: order.itemType,
          amountInPaise: order.amount + order.gstAmount,
          razorpayPaymentId: order.razorpayPaymentId,
        },
      });
    });

    // TODO: revoke the entitlement — e.g. expire the Enrollment immediately
    // for COURSE orders. Left as a TODO since exact revocation semantics per
    // item type aren't fully pinned down yet (docs/srs.md Section 8, item 1
    // touches this for documents specifically).
  }

  private async resolveAmount(
    itemType: CreateOrderDto["itemType"],
    itemId: string,
  ): Promise<number> {
    switch (itemType) {
      case "DOCUMENT": {
        const doc = await this.prisma.generatedDocument.findUnique({
          where: { id: itemId },
          include: { template: true },
        });
        if (!doc) throw new NotFoundException("DOCUMENT_NOT_FOUND");
        return doc.template.priceInPaise;
      }
      case "DOCUMENT_REVIEW": {
        const doc = await this.prisma.generatedDocument.findUnique({
          where: { id: itemId },
          include: { template: true },
        });
        if (!doc) throw new NotFoundException("DOCUMENT_NOT_FOUND");
        return doc.template.reviewPriceInPaise;
      }
      case "CONTENT_ITEM": {
        const item = await this.prisma.contentLibraryItem.findUnique({
          where: { id: itemId },
        });
        if (!item) throw new NotFoundException("CONTENT_ITEM_NOT_FOUND");
        return item.priceInPaise;
      }
      case "COURSE": {
        const course = await this.prisma.course.findUnique({
          where: { id: itemId },
        });
        if (!course) throw new NotFoundException("COURSE_NOT_FOUND");
        return course.priceInPaise;
      }
    }
  }

  private itemFkFor(itemType: CreateOrderDto["itemType"], itemId: string) {
    switch (itemType) {
      case "DOCUMENT":
      case "DOCUMENT_REVIEW":
        return { generatedDocumentId: itemId };
      case "CONTENT_ITEM":
        return { contentLibraryItemId: itemId };
      case "COURSE":
        return { courseId: itemId };
    }
  }
}
