import * as SecureStore from "expo-secure-store";

import { IS_WEB } from "./platform";

// docs/architecture.md Section 3: on Android the refresh token lives in
// encrypted storage (expo-secure-store is backed by the Keystore) and the
// access token in memory only. The refresh token is what keeps someone
// signed in across launches; the access token lasts 15 minutes and is
// re-minted from it.
const REFRESH_TOKEN_KEY = "pratikar.refreshToken";

let accessToken: string | null = null;

export const getAccessToken = () => accessToken;
export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

// The browser preview has no Keystore. It keeps the token in
// localStorage, which any script on the page can read — acceptable for a
// development preview, and the reason the real website uses an httpOnly
// cookie instead.
export const readRefreshToken = async (): Promise<string | null> =>
  IS_WEB
    ? localStorage.getItem(REFRESH_TOKEN_KEY)
    : SecureStore.getItemAsync(REFRESH_TOKEN_KEY);

export const saveRefreshToken = async (token: string): Promise<void> =>
  IS_WEB
    ? localStorage.setItem(REFRESH_TOKEN_KEY, token)
    : SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);

export const clearRefreshToken = async (): Promise<void> =>
  IS_WEB
    ? localStorage.removeItem(REFRESH_TOKEN_KEY)
    : SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
