"use client";

import type { CouponQuote, OrderItemType } from "@pratikar/types";
import { Alert, Button, ButtonLink } from "@pratikar/ui";
import { grossPaise, GST_RATE } from "@pratikar/utils";
import { Tag, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useId, useState } from "react";

import { Icon } from "@/shared/components/Icon";
import { formatPrice } from "@/shared/lib/format";
import { useAuth } from "@/shared/providers/AuthProvider";

import { paymentsApi } from "../api/paymentsApi";
import { useCheckout } from "../hooks/useCheckout";
import { couponMessage } from "../lib/couponMessages";

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
  const [quote, setQuote] = useState<CouponQuote | null>(null);

  const price = quote ? (
    // The discounted total, with what it replaces and what was taken off.
    <div className="space-y-1">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-3xl font-semibold tabular-nums text-ink">
          {formatPrice(quote.totalInPaise)}
        </span>
        <span className="text-base tabular-nums text-ink-subtle line-through">
          {formatPrice(gross)}
        </span>
      </div>
      <p className="text-sm text-ink-subtle">
        {formatPrice(quote.amountInPaise)} + {Math.round(GST_RATE * 100)}% GST ·
        you save {formatPrice(gross - quote.totalInPaise)}
      </p>
    </div>
  ) : (
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

      <CouponField
        itemType={itemType}
        itemId={itemId}
        quote={quote}
        onQuote={setQuote}
        disabled={busy || status === "confirming"}
      />

      <Button
        className="w-full"
        loading={busy}
        disabled={busy || status === "confirming"}
        onClick={() => void buy(itemType, itemId, label, quote?.code)}
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

/**
 * "Have a coupon code?" — folded away until asked for, so the many buyers
 * without one aren't sent hunting for a code. The quote is only a preview:
 * the server checks the code again when the order is made.
 */
function CouponField({
  itemType,
  itemId,
  quote,
  onQuote,
  disabled,
}: {
  itemType: OrderItemType;
  itemId: string;
  quote: CouponQuote | null;
  onQuote: (quote: CouponQuote | null) => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [checking, setChecking] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const inputId = useId();
  const errorId = useId();

  if (quote) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-control border border-success-border bg-success-subtle px-3 py-2.5 text-sm">
        <span className="flex min-w-0 items-center gap-2 text-success-text">
          <Icon icon={Tag} size="xs" />
          <span className="min-w-0">
            <span className="font-semibold">{quote.code}</span> applied
            {quote.description ? ` — ${quote.description}` : ""}
          </span>
        </span>
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            onQuote(null);
            setCode("");
          }}
          className="inline-flex shrink-0 items-center gap-1 font-semibold text-ink hover:underline disabled:opacity-50"
        >
          <Icon icon={X} size="xs" />
          Remove
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink hover:underline"
      >
        <Icon icon={Tag} size="xs" />
        Have a coupon code?
      </button>
    );
  }

  const apply = async () => {
    const trimmed = code.trim();
    if (!trimmed) return;
    setChecking(true);
    setProblem(null);
    try {
      onQuote(await paymentsApi.quote(trimmed, itemType, itemId));
    } catch (error) {
      setProblem(couponMessage(error));
    } finally {
      setChecking(false);
    }
  };

  return (
    <form
      className="space-y-2"
      onSubmit={(event) => {
        event.preventDefault();
        void apply();
      }}
    >
      <label htmlFor={inputId} className="text-sm font-semibold text-ink">
        Coupon code
      </label>
      <div className="flex gap-2">
        <input
          id={inputId}
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={32}
          aria-invalid={problem ? true : undefined}
          aria-describedby={problem ? errorId : undefined}
          className="h-10 min-w-0 flex-1 rounded-control border border-line-strong bg-surface px-3 font-mono text-sm uppercase tracking-wide text-ink"
        />
        <Button
          type="submit"
          variant="secondary"
          loading={checking}
          disabled={checking || disabled || !code.trim()}
        >
          Apply
        </Button>
      </div>
      {problem && (
        <p id={errorId} role="alert" className="text-sm text-danger-text">
          {problem}
        </p>
      )}
    </form>
  );
}
