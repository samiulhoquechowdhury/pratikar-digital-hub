/*
 * Pratikar's service worker. It does one job: browser push notifications.
 *
 * The API sends a message to the browser vendor's push service (see
 * apps/api/src/modules/notifications/web-push.service.ts); the browser wakes
 * this worker with it — even with no Pratikar tab open — and the worker
 * shows it. Tapping it opens the page it points at, reusing an open tab.
 *
 * Deliberately no caching or offline behaviour: a stale copy of a page that
 * shows prices and payment state is worse than no page.
 */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) =>
  event.waitUntil(self.clients.claim()),
);

self.addEventListener("push", (event) => {
  let message = { title: "Pratikar", body: "You have a new update." };
  try {
    if (event.data) message = { ...message, ...event.data.json() };
  } catch {
    // A payload that isn't JSON still deserves a notification.
  }

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(message.title, {
        body: message.body,
        icon: "/icons/icon-192.png",
        badge: "/icons/badge-96.png",
        data: { href: message.href || "/dashboard" },
        // One per destination: a second "ready" for the same document
        // replaces the first instead of stacking.
        tag: message.href || undefined,
      }),
      // Open tabs refresh their bell at once rather than at the next poll.
      self.clients
        .matchAll({ type: "window", includeUncontrolled: true })
        .then((tabs) =>
          tabs.forEach((tab) => tab.postMessage({ type: "notification" })),
        ),
    ]),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const href = (event.notification.data && event.notification.data.href) || "/";
  const target = new URL(href, self.location.origin).href;

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((tabs) => {
        const same = tabs.find((tab) => tab.url === target);
        if (same) return same.focus();
        const ours = tabs.find((tab) => tab.url.startsWith(self.location.origin));
        if (ours) return ours.navigate(target).then((tab) => tab && tab.focus());
        return self.clients.openWindow(target);
      }),
  );
});
