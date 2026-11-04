import type { OrderItemType } from "@pratikar/types";
import { useCallback, useEffect, useRef, useState } from "react";

import { api } from "@/lib/api";
import { IS_WEB, NATIVE_BUILD } from "@/lib/platform";
import { colors } from "@/lib/theme";

import { couponMessage, couponProblemIn } from "./couponMessages";
import { paymentsApi } from "./paymentsApi";

/**
 * The website's useCheckout, with Razorpay's native SDK in place of its web
 * widget. The rule that matters is the same: Razorpay saying "success" is a
 * hint to start checking, not proof — an order is only PAID once Razorpay's
 * signed webhook reaches the API (docs/trd.md 4.4). "confirming" is the
 * honest state in between.
 */
export type CheckoutStatus =
  "idle" | "creating" | "open" | "confirming" | "paid" | "failed";

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 60_000;
const CONFIRM_AFTER_MS = 10_000;
const CONFIRM_EVERY_MS = 20_000;

/**
 * The Key ID only — it identifies the account and is public by design.
 * Asked of the API, so a key set in the admin panel's Integrations needs no
 * new build; EXPO_PUBLIC_RAZORPAY_KEY_ID is the fallback.
 */
async function razorpayKeyId(): Promise<string | undefined> {
  const fromServer = await api
    .get<{ razorpayKeyId: string | null }>("/config/public")
    .then((config) => config.razorpayKeyId)
    .catch(() => null);
  return fromServer ?? process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID;
}

/** Razorpay's SDK rejects with { code, description }; 0 is "closed by the customer". */
const PAYMENT_CANCELLED = 0;

/**
 * Expo Go and the browser preview can't load Razorpay's native SDK —
 * importing it there crashes the app on launch — so it's required only in
 * a real build. Elsewhere every other screen works, and paying says why it
 * can't.
 */
const loadRazorpay = () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  (require("react-native-razorpay") as typeof import("react-native-razorpay"))
    .default;

export function useCheckout(onPaid?: () => void) {
  const [status, setStatus] = useState<CheckoutStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const timers = useRef<ReturnType<typeof setInterval>[]>([]);

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
            .catch(() => undefined);
        }
        void paymentsApi
          .listMine()
          .then((orders) => {
            if (done) return;
            if (orders.find((o) => o.id === orderId)?.status === "PAID") {
              finish();
              return;
            }
            if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
              done = true;
              clearInterval(timer);
              // Not "failed": the webhook may still land, and the money may
              // well have left the customer's account.
              setError(
                "Still waiting for confirmation from the payment provider. " +
                  "If you were charged, this will appear in your purchases shortly.",
              );
              setStatus("idle");
            }
          })
          .catch(() => undefined);
      }, POLL_INTERVAL_MS);

      timers.current.push(timer);
    },
    [onPaid],
  );

  const buy = useCallback(
    async (
      itemType: OrderItemType,
      itemId: string,
      description: string,
      couponCode?: string,
    ) => {
      setError(null);
      if (!NATIVE_BUILD) {
        setError(
          IS_WEB
            ? "Payments run in the Android app or on the website, not in this preview."
            : "Payments need the full Pratikar app — they don't run in Expo Go.",
        );
        setStatus("failed");
        return;
      }
      const key = await razorpayKeyId();
      if (!key) {
        setError("Payments aren't configured on this build yet.");
        setStatus("failed");
        return;
      }
      setStatus("creating");

      let order;
      try {
        order = await paymentsApi.createOrder(itemType, itemId, couponCode);
      } catch (cause) {
        setError(
          couponProblemIn(cause)
            ? `${couponMessage(cause)} Remove it to buy at the full price.`
            : "Couldn't start the payment. Please try again.",
        );
        setStatus("failed");
        return;
      }

      setStatus("open");
      try {
        await loadRazorpay().open({
          key,
          order_id: order.razorpayOrderId,
          // GST is stored separately, so the charge is the sum of the two.
          amount: order.amount + order.gstAmount,
          currency: "INR",
          name: "Pratikar Digital Hub",
          description,
          theme: { color: colors.noir },
        });
        awaitConfirmation(order.id);
      } catch (cause) {
        const code = (cause as { code?: number } | null)?.code;
        if (code === PAYMENT_CANCELLED) {
          setStatus("idle");
          return;
        }
        setError("The payment didn't go through. Please try again.");
        setStatus("failed");
      }
    },
    [awaitConfirmation],
  );

  return { buy, status, error };
}
