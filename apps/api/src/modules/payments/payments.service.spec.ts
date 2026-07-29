import { BadRequestException, NotFoundException } from "@nestjs/common";

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

    expect(refundSpy).toHaveBeenCalledWith("pay_abc", 23482);
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
