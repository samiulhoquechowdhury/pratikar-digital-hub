Notifications, on every channel a customer can be reached:

- **In-app inbox** — `Notification` rows, the bell in the site header. `GET /notifications`, `POST /notifications/read`.
- **Browser push** — the Web Push API with VAPID keys (`VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY`). Browsers subscribe through `POST /notifications/push/subscribe`; `apps/web/public/sw.js` shows the notification. Works on Android and desktop browsers, and on iPhone once the site is added to the Home Screen.
- **App push** — the Android app (`apps/mobile`) registers its Expo push token at `POST /notifications/app-push/register` after sign-in and removes it at `/app-push/unregister` on sign-out (`AppPushToken` rows). `AppPushService` sends through Expo's push service, which delivers through FCM; tokens Expo reports as `DeviceNotRegistered` are deleted. A `push` job goes to browsers and phones together and is retried only when neither got through.
- **Email** — Resend, rendered by `templates.ts`.
- **SMS** — MSG91's Flow API with DLT-registered templates (`MSG91_API_KEY`, `MSG91_TEMPLATE_DOCUMENT_READY`). Logged instead of sent until configured.

`UserNotifier.notifyUser()` is the entry point: it writes the inbox row, then queues push, email and SMS on the `notification-dispatch` queue. It never throws.
