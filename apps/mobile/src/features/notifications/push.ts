import Constants from "expo-constants";
import * as Device from "expo-device";
import { Platform } from "react-native";

import { NATIVE_BUILD } from "@/lib/platform";

import { notificationsApi } from "./notificationsApi";

// Phone push, through Expo's push service (the API's AppPushService sends).
// The token is registered after sign-in, once the customer has allowed
// notifications, and forgotten on sign-out so the next account on the
// phone isn't told about the last one's documents.

/**
 * Expo Go on Android has no push, and merely importing expo-notifications
 * there logs an error; the browser preview has none either. So the module
 * is loaded only in a real build, and everything here quietly does nothing
 * elsewhere.
 */
const PUSH_SUPPORTED = NATIVE_BUILD;

type NotificationsModule = typeof import("expo-notifications");
let notifications: NotificationsModule | null = null;

function loadNotifications(): NotificationsModule | null {
  if (!PUSH_SUPPORTED) return null;
  if (!notifications) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    notifications = require("expo-notifications") as NotificationsModule;
    // Shown while the app is open too — "your reviewed document is ready"
    // is worth a banner even mid-browse.
    notifications.setNotificationHandler({
      handleNotification: () =>
        Promise.resolve({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
    });
  }
  return notifications;
}

let registeredToken: string | null = null;

export type PushPermission =
  "granted" | "denied" | "undetermined" | "unavailable";

export async function pushPermission(): Promise<PushPermission> {
  const N = loadNotifications();
  if (!N || !Device.isDevice) return "unavailable";
  const { status } = await N.getPermissionsAsync();
  return status;
}

/**
 * Registers this phone for the signed-in customer. With `ask`, shows the
 * system prompt if they haven't answered it yet; without, only registers
 * when permission was already given.
 */
export async function registerForPush({
  ask,
}: {
  ask: boolean;
}): Promise<PushPermission> {
  const N = loadNotifications();
  if (!N || !Device.isDevice) return "unavailable";

  if (Platform.OS === "android") {
    await N.setNotificationChannelAsync("default", {
      name: "Documents and orders",
      importance: N.AndroidImportance.HIGH,
    });
  }

  let status = (await N.getPermissionsAsync()).status as PushPermission;
  if (status === "undetermined" && ask) {
    status = (await N.requestPermissionsAsync()).status;
  }
  if (status !== "granted") return status;

  const extra = Constants.expoConfig?.extra as
    { eas?: { projectId?: string } } | undefined;
  const projectId =
    extra?.eas?.projectId ??
    (Constants.easConfig as { projectId?: string } | null | undefined)
      ?.projectId;
  const token = (
    (await N.getExpoPushTokenAsync(projectId ? { projectId } : undefined)) as {
      data: string;
    }
  ).data;
  await notificationsApi.register(
    token,
    Platform.OS === "ios" ? "ios" : "android",
  );
  registeredToken = token;
  return "granted";
}

/** Called on sign-out, before the session ends, while the API still knows who this is. */
export async function unregisterPush(): Promise<void> {
  if (!registeredToken) return;
  const token = registeredToken;
  registeredToken = null;
  await notificationsApi.unregister(token).catch(() => undefined);
}

/**
 * Calls `open` with the website path a tapped notification carries — the
 * one that launched the app, and any tapped while it runs. Returns the
 * unsubscribe.
 */
export function onNotificationTap(open: (href: string) => void): () => void {
  const N = loadNotifications();
  if (!N) return () => undefined;
  const handle = (
    response: {
      notification: {
        request: { content: { data?: Record<string, unknown> } };
      };
    } | null,
  ) => {
    const href = response?.notification.request.content.data?.href;
    if (typeof href === "string" && href.startsWith("/")) open(href);
  };
  void N.getLastNotificationResponseAsync().then(handle);
  const subscription = N.addNotificationResponseReceivedListener(handle);
  return () => subscription.remove();
}
