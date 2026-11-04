import Constants from "expo-constants";
import { Platform } from "react-native";

// Where the app finds the API and the website. EXPO_PUBLIC_* values are
// baked into the bundle at build time, so they hold addresses only — never
// a secret, and a real build must set them.
//
// In development they're left unset: the API runs on the same computer as
// Expo, so its host is the one this bundle came from. That keeps working
// when the computer's Wi-Fi address changes, which a value in .env doesn't.
const devHost = (): string => {
  if (Platform.OS === "web") return window.location.hostname;
  // "10.224.94.6:8081", as Expo Go or a dev build was given it.
  const host = Constants.expoConfig?.hostUri?.split(":")[0];
  // The Android emulator's view of the host machine.
  return host || "10.0.2.2";
};

export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL ?? `http://${devHost()}:4000`
).replace(/\/$/, "");

export const SITE_URL = (
  process.env.EXPO_PUBLIC_SITE_URL ?? `http://${devHost()}:3002`
).replace(/\/$/, "");

/** An absolute URL on the website, for pages the app opens in the browser. */
export const siteUrl = (path: string) =>
  `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
