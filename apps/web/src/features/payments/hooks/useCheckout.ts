"use client";

import type { OrderItemType } from "@pratikar/types";
import { useCallback, useEffect, useRef, useState } from "react";

import { paymentsApi } from "../api/paymentsApi";
import { openCheckout } from "../lib/razorpayCheckout";

/**
 * "confirming" is the state that matters. Razorpay's widget reporting success
 * does not make an order paid — only its signed webhook does — so between the
 * modal closing and the webhook landing we know a payment was attempted and
 * nothing more. Showing "purchased" there would be a lie the server disagrees
 * with, and on a failed capture it would be a lie that gave away the goods.
 */
export type CheckoutStatus =
  "idle" | "creating" | "open" | "confirming" | "paid" | "failed";

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 60_000;
/**
 * When the webhook still hasn't landed, ask the server to check with Razorpay
 * directly — first after this long, then every CONFIRM_EVERY_MS. A lost
 * webhook is otherwise only caught by the ten-minute background sweep.
 */
const CONFIRM_AFTER_MS = 10_000;
const CONFIRM_EVERY_MS = 20_000;

export function useCheckout(onPaid?: () => void) {
  const [status, setStatus] = useState<CheckoutStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const timers = useRef<ReturnType<typeof setInterval>[]>([]);

  // Polling outlives the click that started it, so it has to be torn down on
  // unmount or it keeps hitting the API after the user has navigated away.
  useEffect(
    () => () => {
      timers.current.forEach(clearInterval);
      timers.current = [];
    },
    [],
  );

  const awaitConfirmation = useCallback(
    (orderId: string) => {
      setStatus("confirming");
      const startedAt = Date.now();
      let nextConfirmAt = startedAt + CONFIRM_AFTER_MS;
      let done = false;

      const finish = () => {
        if (done) return;
        done = true;
        clearInterval(timer);
        setStatus("paid");
        onPaid?.();
      };

      const timer = setInterval(() => {
        if (Date.now() >= nextConfirmAt) {
          nextConfirmAt += CONFIRM_EVERY_MS;
          void paymentsApi
            .confirm(orderId)
            .then((order) => {
              if (order.status === "PAID") finish();
            })
            .catch(() => {
              /* the poll below carries on regardless */
            });
        }

        void paymentsApi
          .listMine()
          .then((orders) => {
            if (done) return;
            const order = orders.find((o) => o.id === orderId);
            // FAILED is not an answer here. The widget only calls onSuccess
            // after a payment succeeds, so a FAILED order at this point was
            // left by an earlier declined attempt in the same checkout — and
            // the successful retry's capture will move it to PAID.
            if (order?.status === "PAID") {
              finish();
              return;
            }
            if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
              done = true;
              clearInterval(timer);
              // Deliberately not "failed": the webhook may still arrive, and
              // the money may well have left the customer's account.
              setError(
                "Still waiting for confirmation from the payment provider. " +
                  "If you were charged, this will appear in your purchases shortly.",
              );
              setStatus("idle");
            }
          })
          .catch(() => {
            /* transient — the next tick retries */
          });
      }, POLL_INTERVAL_MS);

      timers.current.push(timer);
    },
    [onPaid],
  );

  const buy = useCallback(
    async (itemType: OrderItemType, itemId: string, description: string) => {
      setError(null);
      setStatus("creating");

      try {
        const order = await paymentsApi.createOrder(itemType, itemId);
        setStatus("open");

        await openCheckout({
          razorpayOrderId: order.razorpayOrderId,
          // GST is stored separately, so the charge is the sum of the two.
          amountInPaise: order.amount + order.gstAmount,
          description,
          onSuccess: () => awaitConfirmation(order.id),
          onDismiss: () => setStatus("idle"),
        });
      } catch (cause) {
        const message = (cause as Error).message;
        setError(
          message.includes("RAZORPAY_KEY_ID_NOT_CONFIGURED")
            ? "Payments aren't configured on this environment yet."
            : message.includes("RAZORPAY_SCRIPT_FAILED")
              ? "Couldn't reach the payment provider. Check your connection and try again."
              : "Couldn't start the payment. Please try again.",
        );
        setStatus("failed");
      }
    },
    [awaitConfirmation],
  );

  return { buy, status, error };
}
