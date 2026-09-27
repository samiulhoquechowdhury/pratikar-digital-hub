"use client";

import type { OrderItemType } from "@pratikar/types";
import { Alert, Button, ButtonLink } from "@pratikar/ui";
import { grossPaise, GST_RATE } from "@pratikar/utils";
import { usePathname } from "next/navigation";

import { formatPrice } from "@/shared/lib/format";
import { useAuth } from "@/shared/providers/AuthProvider";

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
  const { user, isRestoring } = useAuth();
  const pathname = usePathname();
  const gross = grossPaise(priceInPaise);

  const price = (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <span className="text-3xl font-semibold tabular-nums text-ink">
        {formatPrice(gross)}
      </span>
      <span className="text-sm text-ink-subtle">
        {formatPrice(priceInPaise)} + {Math.round(GST_RATE * 100)}% GST
      </span>
    </div>
  );

  // Every product page is public now, so the button is often seen signed out.
  // Asking to sign in here — and coming straight back — beats a Buy button
  // that fails with an auth error after the checkout widget has opened.
  if (!user) {
    return (
      <div className="space-y-4">
        {price}
        <ButtonLink
          href={`/login?next=${encodeURIComponent(pathname)}`}
          className={`w-full ${isRestoring ? "pointer-events-none opacity-60" : ""}`}
        >
          Sign in to buy
        </ButtonLink>
        <p className="text-sm text-ink-muted">
          New here? Signing in creates your account — it takes one code sent to
          your email.
        </p>
      </div>
    );
  }

  if (status === "paid") {
    return (
      <Alert tone="success" role="status">
        Payment confirmed. Your purchase is ready below.
      </Alert>
    );
  }

  const busy = status === "creating" || status === "open";

  return (
    <div className="space-y-4">
      {price}

      <Button
        className="w-full"
        loading={busy}
        disabled={busy || status === "confirming"}
        onClick={() => void buy(itemType, itemId, label)}
      >
        Buy now
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
