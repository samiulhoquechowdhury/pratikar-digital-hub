import { Injectable, Logger, NotFoundException } from "@nestjs/common";

import { PrismaService } from "../../../prisma/prisma.service";
import { PaymentsService, type SettleableOrder } from "../payments.service";
import { RazorpayService } from "../razorpay.service";

/**
 * How long a webhook gets before we go and ask. Razorpay usually delivers in
 * seconds and retries for a day, so this is generous — it only has to stop
 * reconciliation racing a webhook that is merely slow.
 */
export const RECONCILE_AFTER_MS = 15 * 60_000;

/**
 * How far back to keep asking. A payment captured more than a few days after
 * its order was opened doesn't happen; an order still unpaid by then was
 * abandoned, and asking about it forever would be calls for nothing.
 */
export const RECONCILE_LOOKBACK_MS = 3 * 24 * 3600_000;

/** A ceiling per run, so a backlog becomes several runs rather than one long one. */
export const RECONCILE_MAX_PER_RUN = 500;

type ReconcilableOrder = SettleableOrder & { razorpayOrderId: string | null };

const ORDER_FIELDS = {
  id: true,
  userId: true,
  itemType: true,
  status: true,
  courseId: true,
  generatedDocumentId: true,
  razorpayOrderId: true,
} as const;

/**
 * Catches payments whose webhook never arrived.
 *
 * The webhook is the normal path to PAID, but a webhook can be lost — an
 * outage on our side for longer than Razorpay keeps retrying, a deploy at the
 * wrong moment, a misconfigured endpoint. Without this, that customer has
 * paid and has nothing, and only finds out by writing to support
 * (docs/srs.md 3.7, step 6).
 *
 * It asks Razorpay, server to server, which payments exist for the order.
 * Only a captured payment settles it, through the same code the webhook
 * runs. It never marks anything FAILED: a customer can still be in checkout,
 * and declining an order is the webhook's job.
 */
@Injectable()
export class PaymentReconciliationService {
  private readonly logger = new Logger(PaymentReconciliationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly razorpay: RazorpayService,
    private readonly payments: PaymentsService,
  ) {}

  /** Settles the order if Razorpay captured a payment for it. */
  async reconcileOrder(
    order: ReconcilableOrder,
  ): Promise<"settled" | "unpaid"> {
    if (!order.razorpayOrderId) return "unpaid";

    const attempts = await this.razorpay.fetchOrderPayments(
      order.razorpayOrderId,
    );
    // "refunded" means captured and then returned outside this app — the
    // money went back, so there's nothing to hand over.
    const captured = attempts.find((attempt) => attempt.status === "captured");
    if (!captured) return "unpaid";

    const { settled } = await this.payments.settleCapturedPayment(
      order,
      captured.id,
    );
    if (settled) {
      this.logger.warn(
        `Order ${order.id} was paid but its webhook never arrived — settled from Razorpay`,
      );
    }
    return "settled";
  }

  /** The scheduled sweep: every recent order still waiting on a webhook. */
  async reconcileStale(now = new Date()) {
    const orders = await this.prisma.order.findMany({
      where: {
        status: { in: ["PENDING", "FAILED"] },
        razorpayOrderId: { not: null },
        createdAt: {
          lte: new Date(now.getTime() - RECONCILE_AFTER_MS),
          gte: new Date(now.getTime() - RECONCILE_LOOKBACK_MS),
        },
      },
      select: ORDER_FIELDS,
      // Newest first: the customer most likely to be waiting.
      orderBy: { createdAt: "desc" },
      take: RECONCILE_MAX_PER_RUN,
    });

    let settled = 0;
    let errors = 0;
    // One at a time, and one order's failure doesn't stop the rest: a
    // Razorpay hiccup on one call shouldn't cost every other customer their
    // purchase until the next run.
    for (const order of orders) {
      try {
        if ((await this.reconcileOrder(order)) === "settled") settled += 1;
      } catch (error) {
        errors += 1;
        this.logger.error(
          `Could not reconcile order ${order.id}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    if (orders.length === RECONCILE_MAX_PER_RUN) {
      this.logger.warn(
        `Reconciliation hit its ${RECONCILE_MAX_PER_RUN}-order ceiling; the rest wait for the next run`,
      );
    }
    return { checked: orders.length, settled, errors };
  }

  /**
   * The customer's own "I've paid — where is it?", asked from the checkout
   * screen when confirmation is slow. The answer still comes from Razorpay,
   * never from the browser, so asking can't make an unpaid order paid.
   */
  async confirmForCustomer(orderId: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      select: ORDER_FIELDS,
    });
    if (!order) throw new NotFoundException("ORDER_NOT_FOUND");

    if (order.status === "PENDING" || order.status === "FAILED") {
      await this.reconcileOrder(order);
      const current = await this.prisma.order.findUniqueOrThrow({
        where: { id: orderId },
        select: { status: true },
      });
      return { id: orderId, status: current.status };
    }
    return { id: orderId, status: order.status };
  }
}
