/**
 * The browser side of web push: what this browser can do, and the key
 * conversion PushManager.subscribe() needs.
 */

export type PushSupport =
  /** Service workers and the Push API both exist. */
  | "supported"
  /**
   * An iPhone or iPad in Safari, not added to the home screen. Apple only
   * offers web push to an installed site (iOS 16.4+), so the answer here is
   * "add it to your home screen", not "your browser can't".
   */
  | "ios-needs-install"
  | "unsupported";

export function pushSupport(): PushSupport {
  if (typeof window === "undefined") return "unsupported";
  const supported =
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window;
  if (supported) return "supported";

  const ios =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const standalone =
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return ios && !standalone ? "ios-needs-install" : "unsupported";
}

/** A VAPID key as base64url, to the bytes PushManager.subscribe() wants. */
export function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4))
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const raw = atob(padded);
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}

/** The service worker that shows push notifications, registered once. */
export function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  return navigator.serviceWorker.register("/sw.js", { scope: "/" });
}
