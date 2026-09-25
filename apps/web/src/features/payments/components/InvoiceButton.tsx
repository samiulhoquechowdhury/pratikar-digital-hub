"use client";

import { useState } from "react";

import { paymentsApi } from "../api/paymentsApi";

/**
 * Fetches the invoice on click and opens the PDF.
 *
 * Two-step on purpose. The download URL is signed with a short expiry, so
 * minting one for every row when the table loads would hand out links that
 * are already dead by the time anyone clicks — and would leak a downloadable
 * link for every order into the page source.
 */
export function InvoiceButton({ orderId }: { orderId: string }) {
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");

  const open = async () => {
    setState("loading");
    try {
      const invoice = await paymentsApi.getInvoice(orderId);
      // A blank tab beats replacing the dashboard: the customer is browsing
      // their history, not leaving it.
      window.open(invoice.downloadUrl, "_blank", "noopener,noreferrer");
      setState("idle");
    } catch {
      setState("error");
    }
  };

  if (state === "error") {
    return (
      <span className="text-xs text-danger-text" role="alert">
        Not available
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void open()}
      disabled={state === "loading"}
      className="text-sm font-semibold text-primary hover:text-primary-hover disabled:opacity-50"
    >
      {state === "loading" ? "Opening…" : "Invoice"}
    </button>
  );
}
