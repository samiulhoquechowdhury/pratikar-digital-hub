# Pratikar — Android app

Milestone 5 in `docs/implementation-plan.md`: the customer side of the website in React Native (Expo SDK 58, Expo Router), against the same API. Admin stays web-only.

## Run it

```bash
scripts/dev-mobile.sh        # API :4000, website :3002, Expo :8081 — keeps running after the terminal closes
scripts/dev-mobile.sh stop   # stops all three
```

It prints the address to use. Logs are in `/tmp/pratikar-dev/`. Metro takes a few minutes to start on a slow disk, and the first bundle longer.

- **Browser:** http://localhost:8081
- **Expo Go:** "Enter URL manually", `exp://<address it printed>:8081`, phone on the same Wi-Fi. Expo Go must support SDK 58; an older one says "Project is incompatible". The Play Store version may lag — the APK for each SDK is on https://expo.dev/go.
- **Real build:** `pnpm --filter mobile android` or `eas build --profile development`. Needs the Android SDK on your `PATH`.

On this NTFS disk Metro can miss file changes. If an edit doesn't show up, stop Expo and run the script again rather than reloading the app.

Leave `EXPO_PUBLIC_API_URL` unset in development: the app uses the computer Expo is running on, which keeps working when its Wi-Fi address changes. If the address changes, run `scripts/dev-mobile.sh` again so the API allows the new origin.

Payments and push need a real build. Expo Go and the browser run everything else, and paying says why it can't. The browser keeps the session in `localStorage`, so it's a preview, not something to ship.

## How it differs from the website

- **Access.** The app needs an account: signed out, every screen leads to the onboarding (`/welcome`), then sign-in by mobile number and a 6-digit SMS code (MSG91). Without MSG91 set up, the code appears in the API log in development.
- **Session.** No cookies: the app sends `X-Pratikar-Client: android`, so sign-in returns the refresh token in the body. It's kept in the Android Keystore (`expo-secure-store`) and sent in the body of `/auth/refresh` and `/auth/logout`. The access token stays in memory.
- **Payments.** Razorpay's native SDK (`react-native-razorpay`). As on the web, the SDK's "success" only starts the check — an order is paid when Razorpay's webhook says so.
- **Downloads.** The signed URL is saved to the phone and handed to the share sheet, so the one-time download isn't lost.
- **Push.** Expo push tokens, registered at `POST /notifications/app-push/register` after sign-in and removed on sign-out. The API's `AppPushService` sends every notification to phones as well as browsers. Production builds need the app's FCM credentials uploaded to EAS.
- **Courses.** Off until `EXPO_PUBLIC_COURSES_LIVE=true`, like `NEXT_PUBLIC_COURSES_LIVE`. Until then `/courses` lists the 46 courses being prepared (`PLANNED_COURSES` in `@pratikar/utils`).

## Not yet

- **Google sign-in.** Needs an Android OAuth client in Google Cloud (package `com.pratikar.digitalhub` and the signing key's SHA-1), added to the API's `GOOGLE_CLIENT_ID` list. Email and phone codes work today.
- **Lesson video.** Waits on Cloudflare Stream, exactly as on the website.
