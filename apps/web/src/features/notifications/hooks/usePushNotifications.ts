"use client";

import { useCallback, useEffect, useState } from "react";

import { notificationsApi } from "../api/notificationsApi";
import {
  pushSupport,
  registerServiceWorker,
  urlBase64ToUint8Array,
} from "../lib/push";

/**
 *   loading            still finding out
 *   on                 this browser is subscribed
 *   off                it could be; it isn't
 *   denied             the browser blocked notifications for this site
 *   ios-needs-install  iPhone Safari: add to home screen first
 *   unavailable        this browser can't, or the server has push switched off
 */
export type PushState =
  "loading" | "on" | "off" | "denied" | "ios-needs-install" | "unavailable";

/**
 * Browser push for the signed-in customer on this device: whether it's on,
 * and turning it on or off. Turning it on asks the browser's permission —
 * so it must only ever run from a click, never on page load, or browsers
 * learn to block the prompt and the customer learns to ignore it.
 */
export function usePushNotifications() {
  const [state, setState] = useState<PushState>("loading");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const support = pushSupport();
    if (support !== "supported") {
      setState(support === "ios-needs-install" ? support : "unavailable");
      return;
    }
    if (Notification.permission === "denied") {
      setState("denied");
      return;
    }
    void (async () => {
      try {
        const { publicKey } = await notificationsApi.pushKey();
        if (!publicKey) {
          if (!cancelled) setState("unavailable");
          return;
        }
        const registration = await navigator.serviceWorker.getRegistration("/");
        const subscription = await registration?.pushManager.getSubscription();
        if (!cancelled) setState(subscription ? "on" : "off");
      } catch {
        if (!cancelled) setState("unavailable");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const enable = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "off");
        return;
      }
      const { publicKey } = await notificationsApi.pushKey();
      if (!publicKey) {
        setState("unavailable");
        return;
      }
      const registration = await registerServiceWorker();
      await navigator.serviceWorker.ready;
      const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        }));
      await notificationsApi.subscribe(subscription.toJSON());
      setState("on");
    } catch {
      setError("Couldn't turn on notifications. Please try again.");
    } finally {
      setBusy(false);
    }
  }, []);

  const disable = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const registration = await navigator.serviceWorker.getRegistration("/");
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await notificationsApi.unsubscribe(subscription.endpoint);
        await subscription.unsubscribe();
      }
      setState("off");
    } catch {
      setError("Couldn't turn off notifications. Please try again.");
    } finally {
      setBusy(false);
    }
  }, []);

  return { state, busy, error, enable, disable };
}
