/**
 * Loads and opens Razorpay's hosted checkout.
 *
 * Kept out of the React tree because it's imperative and global: the script
 * attaches window.Razorpay, and the widget renders its own modal outside our
 * DOM. Everything here is types and side effects around that.
 */

const CHECKOUT_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

/** What Razorpay hands the success callback. Not to be trusted — see below. */
export interface CheckoutSuccess {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  order_id: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  handler: (response: CheckoutSuccess) => void;
  modal?: { ondismiss?: () => void };
  prefill?: { email?: string; contact?: string; name?: string };
  theme?: { color?: string };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, handler: (payload: unknown) => void) => void;
}

type RazorpayConstructor = new (options: RazorpayOptions) => RazorpayInstance;

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

let scriptPromise: Promise<void> | null = null;

/** Loads checkout.js once per page, even if several buy buttons ask for it. */
function loadCheckoutScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = CHECKOUT_SCRIPT;
    script.onload = () => resolve();
    script.onerror = () => {
      // Let the next attempt retry rather than caching the rejection forever.
      scriptPromise = null;
      reject(new Error("RAZORPAY_SCRIPT_FAILED"));
    };
    document.body.appendChild(script);
  });

  return scriptPromise;
}

/**
 * Opens the payment modal for an order created by our API.
 *
 * `onSuccess` fires when Razorpay's widget reports a successful payment. That
 * is a hint to start checking, not proof of payment: the order only becomes
 * PAID when Razorpay's signed webhook reaches our API (docs/trd.md 4.4).
 * Nothing in this file may grant access to anything.
 */
export async function openCheckout(params: {
  razorpayOrderId: string;
  amountInPaise: number;
  description: string;
  prefill?: { email?: string; contact?: string; name?: string };
  onSuccess: () => void;
  onDismiss: () => void;
}): Promise<void> {
  const key = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  // Only the Key ID belongs in the browser bundle. If it's missing, say so
  // plainly rather than opening a modal that can't complete.
  if (!key) throw new Error("RAZORPAY_KEY_ID_NOT_CONFIGURED");

  await loadCheckoutScript();
  const Razorpay = window.Razorpay;
  if (!Razorpay) throw new Error("RAZORPAY_SCRIPT_FAILED");

  const instance = new Razorpay({
    key,
    order_id: params.razorpayOrderId,
    amount: params.amountInPaise,
    currency: "INR",
    name: "Pratikar Digital Hub",
    description: params.description,
    prefill: params.prefill,
    handler: () => params.onSuccess(),
    modal: { ondismiss: () => params.onDismiss() },
  });

  instance.open();
}
