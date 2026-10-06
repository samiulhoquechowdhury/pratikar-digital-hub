"use client";

import { Alert, Button } from "@pratikar/ui";
import { BellRing, CheckCircle2 } from "lucide-react";

import { Icon } from "@/shared/components/Icon";

import { usePushNotifications } from "../hooks/usePushNotifications";

/**
 * "Notify me on this device" — browser push for the signed-in customer.
 *
 * `compact` is the inline prompt shown where waiting starts (a review just
 * bought); it hides itself when push is on or impossible, so it never nags.
 * The full version lives in account settings and always explains the state.
 */
export function PushOptIn({ compact = false }: { compact?: boolean }) {
  const { state, busy, error, enable, disable } = usePushNotifications();

  if (compact) {
    if (state !== "off" && state !== "ios-needs-install") return null;
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-card border border-brand-border bg-brand-subtle px-4 py-3">
        <Icon icon={BellRing} className="text-gold-ink" />
        <p className="min-w-0 flex-1 text-sm text-ink">
          {state === "ios-needs-install"
            ? "On iPhone, add this site to your Home Screen (Share → Add to Home Screen) to get a notification when it's ready."
            : "Get a notification on this device the moment it's ready."}
        </p>
        {state === "off" && (
          <Button
            size="sm"
            onClick={() => void enable()}
            loading={busy}
            loadingLabel="Turning on…"
          >
            Notify me
          </Button>
        )}
        {error && <p className="w-full text-xs text-danger-text">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {state === "loading" && (
        <p className="text-sm text-ink-muted">Checking this device…</p>
      )}
      {state === "on" && (
        <div className="flex flex-wrap items-center gap-3">
          <p className="flex items-center gap-2 text-sm text-ink">
            <Icon icon={CheckCircle2} className="text-success-text" />
            Notifications are on for this device.
          </p>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => void disable()}
            loading={busy}
          >
            Turn off
          </Button>
        </div>
      )}
      {state === "off" && (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-ink-muted">
            Get a notification on this device when a document is reviewed and
            ready, even with the site closed.
          </p>
          <Button
            size="sm"
            onClick={() => void enable()}
            loading={busy}
            loadingLabel="Turning on…"
          >
            Turn on notifications
          </Button>
        </div>
      )}
      {state === "denied" && (
        <Alert tone="warning">
          Notifications are blocked for this site in your browser. Allow them in
          the browser&apos;s site settings (the icon left of the address), then
          reload this page.
        </Alert>
      )}
      {state === "ios-needs-install" && (
        <Alert tone="info">
          On iPhone and iPad, notifications work once the site is on your Home
          Screen: tap Share, then &ldquo;Add to Home Screen&rdquo;, and open
          Pratikar from there.
        </Alert>
      )}
      {state === "unavailable" && (
        <p className="text-sm text-ink-muted">
          Device notifications aren&apos;t available in this browser.
          You&apos;ll still get updates by email, SMS and in the bell at the top
          of the site.
        </p>
      )}
      {error && (
        <Alert tone="danger" role="alert">
          {error}
        </Alert>
      )}
    </div>
  );
}
