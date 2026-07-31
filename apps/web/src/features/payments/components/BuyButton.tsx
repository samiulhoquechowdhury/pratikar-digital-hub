"use client";

import type { OrderItemType } from "@pratikar/types";
import { Alert, Button } from "@pratikar/ui";
import { formatPaise, grossPaise, GST_RATE } from "@pratikar/utils";

import { useCheckout } from "../hooks/useCheckout";

/**
 * Starts a purchase and reports honestly on where it got to.
 *
 * The price shown includes GST, because that's what will be charged; orders
 * store the item price and the tax separately, so quoting the bare price here
 * would understate the total.
 */
export function BuyButton({
  itemType,
  itemId,
  label,
  priceInPaise,
  onPaid,
}: {
  itemType: OrderItemType;
  itemId: string;
  label: string;
  /** Item price excluding GST — the button adds tax for display. */
  priceInPaise: number;
  onPaid?: () => void;
}) {
  const { buy, status, error } = useCheckout(onPaid);
  const gross = grossPaise(priceInPaise);

  if (status === "paid") {
    return (
      <Alert tone="success" role="status">
        Payment confirmed. Your purchase is ready below.
      </Alert>
    );
  }

  const busy = status === "creating" || status === "open";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-2xl font-semibold text-ink">
          {formatPaise(gross)}
        </span>
        <span className="text-sm text-ink-subtle">
          {formatPaise(priceInPaise)} + {Math.round(GST_RATE * 100)}% GST
        </span>
      </div>

      <Button
        disabled={busy || status === "confirming"}
        onClick={() => void buy(itemType, itemId, label)}
      >
        {busy ? "Opening checkout…" : "Buy now"}
      </Button>

      {status === "confirming" && (
        <Alert tone="info" role="status">
          Confirming your payment with the provider. This usually takes a few
          seconds — please don&apos;t close this page.
        </Alert>
      )}

      {error && (
        <Alert tone="danger" role="alert">
          {error}
        </Alert>
      )}
    </div>
  );
}
