import { NotFoundException } from "@nestjs/common";

import type { PrismaService } from "../../../prisma/prisma.service";
import type { PaymentsService } from "../payments.service";
import type { RazorpayPayment, RazorpayService } from "../razorpay.service";

import {
  PaymentReconciliationService,
  RECONCILE_AFTER_MS,
  RECONCILE_LOOKBACK_MS,
} from "./payment-reconciliation.service";

/**
 * Reconciliation is what stands between a lost webhook and a customer who
 * paid and got nothing. What matters: it settles only on a capture Razorpay
 * itself reports, never fails an order, and one bad order doesn't stop the
 * sweep.
 */
describe("PaymentReconciliationService", () => {
  type Row = Parameters<PaymentReconciliationService["reconcileOrder"]>[0];
  const order = (overrides: Partial<Row> = {}): Row => ({
    id: "ord-1",
    userId: "cust-1",
    itemType: "COURSE",
    status: "PENDING",
    courseId: "course-1",
    generatedDocumentId: null,
    razorpayOrderId: "order_rzp_1",
    ...overrides,
  });

  const build = ({
    attempts = [] as RazorpayPayment[],
    orders = [order()] as unknown[],
  } = {}) => {
    const prisma = {
      order: {
        findMany: jest.fn().mockResolvedValue(orders),
        findFirst: jest.fn().mockResolvedValue(orders[0] ?? null),
        findUniqueOrThrow: jest.fn().mockResolvedValue({ status: "PAID" }),
      },
    };
    const razorpay = {
      fetchOrderPayments: jest.fn().mockResolvedValue(attempts),
    };
    const payments = {
      settleCapturedPayment: jest.fn().mockResolvedValue({ settled: true }),
    };
    const service = new PaymentReconciliationService(
      prisma as unknown as PrismaService,
      razorpay as unknown as RazorpayService,
      payments as unknown as PaymentsService,
    );
    return { service, prisma, razorpay, payments };
  };

  describe("reconcileOrder", () => {
    it("settles the order with the captured payment's id", async () => {
      const { service, payments } = build({
        attempts: [
          { id: "pay_declined", status: "failed" },
          { id: "pay_ok", status: "captured" },
        ],
      });

      await expect(service.reconcileOrder(order())).resolves.toBe("settled");
      expect(payments.settleCapturedPayment).toHaveBeenCalledWith(
        expect.objectContaining({ id: "ord-1" }),
        "pay_ok",
      );
    });

    // Authorised isn't captured: no money has moved yet, and an
    // uncaptured authorisation is released back to the customer.
    it("leaves an order alone when nothing was captured", async () => {
      const { service, payments } = build({
        attempts: [
          { id: "pay_1", status: "failed" },
          { id: "pay_2", status: "authorized" },
        ],
      });

      await expect(service.reconcileOrder(order())).resolves.toBe("unpaid");
      expect(payments.settleCapturedPayment).not.toHaveBeenCalled();
    });

    // Captured and then refunded outside the app: the money went back.
    it("does not hand over goods for a payment that was refunded", async () => {
      const { service, payments } = build({
        attempts: [{ id: "pay_1", status: "refunded" }],
      });

      await service.reconcileOrder(order());

      expect(payments.settleCapturedPayment).not.toHaveBeenCalled();
    });

    it("never asks Razorpay about an order that has no Razorpay order", async () => {
      const { service, razorpay } = build();

      await service.reconcileOrder(order({ razorpayOrderId: null }));

      expect(razorpay.fetchOrderPayments).not.toHaveBeenCalled();
    });
  });

  describe("reconcileStale", () => {
    it("checks recent unsettled orders, after giving the webhook time", async () => {
      const { service, prisma } = build();
      const now = new Date("2026-10-02T12:00:00Z");

      await service.reconcileStale(now);

      const query = (
        prisma.order.findMany.mock.calls[0] as [
          {
            where: {
              status: unknown;
              razorpayOrderId: unknown;
              createdAt: { lte: Date; gte: Date };
            };
          },
        ]
      )[0];
      expect(query.where.status).toEqual({ in: ["PENDING", "FAILED"] });
      expect(query.where.razorpayOrderId).toEqual({ not: null });
      expect(query.where.createdAt.lte).toEqual(
        new Date(now.getTime() - RECONCILE_AFTER_MS),
      );
      expect(query.where.createdAt.gte).toEqual(
        new Date(now.getTime() - RECONCILE_LOOKBACK_MS),
      );
    });

    it("carries on past an order Razorpay couldn't answer for", async () => {
      const { service, razorpay, payments } = build({
        orders: [
          order({ id: "ord-1", razorpayOrderId: "order_a" }),
          order({ id: "ord-2", razorpayOrderId: "order_b" }),
        ],
      });
      razorpay.fetchOrderPayments
        .mockRejectedValueOnce(new Error("PAYMENT_GATEWAY_UNREACHABLE"))
        .mockResolvedValueOnce([{ id: "pay_b", status: "captured" }]);

      const result = await service.reconcileStale();

      expect(result).toEqual({ checked: 2, settled: 1, errors: 1 });
      expect(payments.settleCapturedPayment).toHaveBeenCalledWith(
        expect.objectContaining({ id: "ord-2" }),
        "pay_b",
      );
    });
  });

  describe("confirmForCustomer", () => {
    it("checks with Razorpay and returns the settled status", async () => {
      const { service, razorpay } = build({
        attempts: [{ id: "pay_ok", status: "captured" }],
      });

      await expect(
        service.confirmForCustomer("ord-1", "cust-1"),
      ).resolves.toEqual({ id: "ord-1", status: "PAID" });
      expect(razorpay.fetchOrderPayments).toHaveBeenCalledWith("order_rzp_1");
    });

    // Knowing an order id must not let someone poke at another
    // customer's order.
    it("only looks at the customer's own order", async () => {
      const { service, prisma } = build({ orders: [] });

      await expect(
        service.confirmForCustomer("ord-1", "someone-else"),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.order.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "ord-1", userId: "someone-else" },
        }),
      );
    });

    it("doesn't call Razorpay for an order that is already settled", async () => {
      const { service, razorpay } = build({
        orders: [order({ status: "PAID" })],
      });

      await expect(
        service.confirmForCustomer("ord-1", "cust-1"),
      ).resolves.toEqual({ id: "ord-1", status: "PAID" });
      expect(razorpay.fetchOrderPayments).not.toHaveBeenCalled();
    });
  });
});
