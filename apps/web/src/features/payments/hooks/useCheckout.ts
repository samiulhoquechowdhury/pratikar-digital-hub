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

      const timer = setInterval(() => {
        void paymentsApi
          .listMine()
          .then((orders) => {
            const order = orders.find((o) => o.id === orderId);
            if (order?.status === "PAID") {
              clearInterval(timer);
              setStatus("paid");
              onPaid?.();
              return;
            }
            if (order?.status === "FAILED") {
              clearInterval(timer);
              setError("The payment didn't go through.");
              setStatus("failed");
              return;
            }
            if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
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
