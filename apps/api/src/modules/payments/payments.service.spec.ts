import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";

import type { PrismaService } from "../../prisma/prisma.service";
import {
  AuditAction,
  AuditService,
  AuditTargetType,
} from "../audit/audit.service";
import type { DocumentsService } from "../documents/documents.service";
import type { LmsService } from "../lms/lms.service";

import { PaymentsService } from "./payments.service";
import type { RazorpayService } from "./razorpay.service";

/**
 * Refunds move real money and cannot be undone, so the guards that stop a
 * double refund and the audit row that records who authorised it are the two
 * things worth pinning down.
 */
describe("PaymentsService.refund", () => {
  const paidOrder = {
    id: "ord-1",
    userId: "cust-1",
    itemType: "DOCUMENT",
    amount: 19900,
    gstAmount: 3582,
    status: "PAID",
    razorpayPaymentId: "pay_abc",
  };

  const build = (order: unknown, refundImpl = jest.fn()) => {
    const tx = {
      order: { update: jest.fn() },
      auditLog: { create: jest.fn() },
    };
    const prisma = {
      order: { findUnique: jest.fn().mockResolvedValue(order) },
      $transaction: jest.fn((cb: (client: typeof tx) => unknown) => cb(tx)),
    };
    const razorpay = { refund: refundImpl } as unknown as RazorpayService;
    const service = new PaymentsService(
      prisma as unknown as PrismaService,
      razorpay,
      {} as DocumentsService,
      {} as LmsService,
      new AuditService(prisma as unknown as PrismaService),
    );
    return { service, prisma, tx, razorpay };
  };

  it("records who authorised the refund, the amount, and the payment reference", async () => {
    const { service, tx } = build(paidOrder);

    await service.refund("ord-1", "admin-1");

    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: {
        actorUserId: "admin-1",
        action: AuditAction.ORDER_REFUNDED,
        targetType: AuditTargetType.ORDER,
        targetId: "ord-1",
        metadata: {
          refundedToUserId: "cust-1",
          itemType: "DOCUMENT",
          // Customer is refunded the full charge, GST included.
          amountInPaise: 23482,
          razorpayPaymentId: "pay_abc",
        },
      },
    });
  });

  it("refunds the gross amount, not the pre-GST amount", async () => {
    const refundSpy = jest.fn();
    const { service } = build(paidOrder, refundSpy);

    await service.refund("ord-1", "admin-1");

    // Third argument is the idempotency key — the order id, so a retry after
    // a failed database write replays rather than repeats the refund.
    expect(refundSpy).toHaveBeenCalledWith("pay_abc", 23482, "ord-1");
  });

  // Without this guard a second click would issue a second Razorpay refund
  // against an order already marked REFUNDED.
  it("refuses to refund an order that isn't PAID, and never calls Razorpay", async () => {
    const refundSpy = jest.fn();
    const { service, tx } = build(
      { ...paidOrder, status: "REFUNDED" },
      refundSpy,
    );

    await expect(service.refund("ord-1", "admin-1")).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(refundSpy).not.toHaveBeenCalled();
    expect(tx.auditLog.create).not.toHaveBeenCalled();
  });

  it("refuses when there is no captured payment to reverse", async () => {
    const { service } = build({ ...paidOrder, razorpayPaymentId: null });

    await expect(service.refund("ord-1", "admin-1")).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it("rejects an unknown order", async () => {
    const { service } = build(null);

    await expect(service.refund("nope", "admin-1")).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

/**
 * The webhook is the only path that marks an order PAID and hands over the
 * goods, and it is reachable without authentication. Two things carry the
 * weight: the signature check, and the fact that Razorpay retries until it
 * gets a 2xx — so the handler runs repeatedly for one payment.
 */
describe("PaymentsService.handleWebhook", () => {
  const pendingOrder = {
    id: "ord-1",
    userId: "cust-1",
    itemType: "COURSE",
    courseId: "course-1",
    generatedDocumentId: null,
    status: "PENDING",
  };

  /** The real envelope Razorpay posts: the ids sit three levels down. */
  const capturedEvent = (event = "payment.captured", orderId = "order_rzp_1") =>
    JSON.stringify({
      entity: "event",
      event,
      contains: ["payment"],
      payload: {
        payment: { entity: { id: "pay_abc", order_id: orderId } },
      },
    });

  const build = (
    opts: {
      order?: unknown;
      signatureValid?: boolean;
      /**
       * How many rows the conditional update matched: 1 on the first
       * delivery, 0 on a retry once the order has left PENDING.
       */
      updateCount?: number;
    } = {},
  ) => {
    const {
      order = pendingOrder,
      signatureValid = true,
      updateCount = 1,
    } = opts;
    const prisma = {
      order: {
        findUnique: jest.fn().mockResolvedValue(order),
        updateMany: jest.fn().mockResolvedValue({ count: updateCount }),
      },
    };
    const razorpay = {
      verifyWebhookSignature: jest.fn().mockReturnValue(signatureValid),
    } as unknown as RazorpayService;
    const lms = { enroll: jest.fn() };
    const service = new PaymentsService(
      prisma as unknown as PrismaService,
      razorpay,
      {} as DocumentsService,
      lms as unknown as LmsService,
      {} as AuditService,
    );
    return { service, prisma, lms };
  };

  it("marks the order paid and grants the entitlement", async () => {
    const { service, prisma, lms } = build();

    await service.handleWebhook(capturedEvent(), "sig");

    // Looked up by the Razorpay order id pulled out of the nested envelope.
    expect(prisma.order.findUnique).toHaveBeenCalledWith({
      where: { razorpayOrderId: "order_rzp_1" },
    });
    expect(prisma.order.updateMany).toHaveBeenCalledWith({
      where: { id: "ord-1", status: "PENDING" },
      data: { status: "PAID", razorpayPaymentId: "pay_abc" },
    });
    expect(lms.enroll).toHaveBeenCalledWith("cust-1", "course-1", "ord-1");
  });

  /**
   * Razorpay redelivers until it sees a 2xx. Without the conditional update
   * a redelivery would enrol the customer a second time and reset their
   * access window.
   */
  it("does not grant the entitlement twice when Razorpay redelivers", async () => {
    const { service, lms } = build({ updateCount: 0 });

    await service.handleWebhook(capturedEvent(), "sig");

    expect(lms.enroll).not.toHaveBeenCalled();
  });

  it("rejects an event whose signature does not verify, before touching the database", async () => {
    const { service, prisma } = build({ signatureValid: false });

    await expect(
      service.handleWebhook(capturedEvent(), "forged"),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.order.findUnique).not.toHaveBeenCalled();
  });

  /**
   * Razorpay does not guarantee delivery order, so a stale failure event can
   * arrive after a successful capture. Scoping to PENDING stops it revoking
   * something the customer already paid for.
   */
  it("only fails an order that is still pending", async () => {
    const { service, prisma, lms } = build();

    await service.handleWebhook(capturedEvent("payment.failed"), "sig");

    expect(prisma.order.updateMany).toHaveBeenCalledWith({
      where: { id: "ord-1", status: "PENDING" },
      data: { status: "FAILED" },
    });
    expect(lms.enroll).not.toHaveBeenCalled();
  });

  // The endpoint receives every event it is subscribed to; unrelated ones are
  // acknowledged and ignored rather than treated as errors that trigger retries.
  it("ignores events it does not handle", async () => {
    const { service, prisma } = build();

    await service.handleWebhook(capturedEvent("refund.processed"), "sig");

    expect(prisma.order.findUnique).not.toHaveBeenCalled();
  });

  it("rejects a body that is not valid JSON", async () => {
    const { service } = build();

    await expect(
      service.handleWebhook("not json", "sig"),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("rejects a signed event for an order it does not know", async () => {
    const { service } = build({ order: null });

    await expect(
      service.handleWebhook(capturedEvent(), "sig"),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
