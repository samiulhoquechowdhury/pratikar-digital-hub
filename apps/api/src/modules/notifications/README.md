Notifications, on every channel a customer can be reached:

- **In-app inbox** — `Notification` rows, the bell in the site header. `GET /notifications`, `POST /notifications/read`.
- **Browser push** — the Web Push API with VAPID keys (`VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY`). Browsers subscribe through `POST /notifications/push/subscribe`; `apps/web/public/sw.js` shows the notification. Works on Android and desktop browsers, and on iPhone once the site is added to the Home Screen.
- **Email** — Resend, rendered by `templates.ts`.
- **SMS** — MSG91's Flow API with DLT-registered templates (`MSG91_API_KEY`, `MSG91_TEMPLATE_DOCUMENT_READY`). Logged instead of sent until configured.

`UserNotifier.notifyUser()` is the entry point: it writes the inbox row, then queues push, email and SMS on the `notification-dispatch` queue. It never throws.
