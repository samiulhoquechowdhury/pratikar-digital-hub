import type { AuthenticatedUser, AuthSession } from "@pratikar/types";
import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { registerForPush, unregisterPush } from "@/features/notifications/push";
import { api, onSessionChange, refreshSession } from "@/lib/api";
import {
  clearRefreshToken,
  readRefreshToken,
  saveRefreshToken,
  setAccessToken,
} from "@/lib/session";

/** What a sign-in returns to the app: the web's session plus the refresh token. */
export type AppSession = AuthSession & { refreshToken?: string };

interface AuthContextValue {
  user: AuthenticatedUser | null;
  /** True until the stored token has been tried on launch. */
  isRestoring: boolean;
  login: (session: AppSession) => Promise<void>;
  /** Ends this session, or with allDevices every session on the account. */
  logout: (allDevices?: boolean) => Promise<void>;
  updateUser: (changes: Partial<AuthenticatedUser>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);

  // Launching the app picks up where the last session left off: the stored
  // refresh token is exchanged for an access token. Offline, it stays
  // stored and is tried again by the first request that needs it.
  useEffect(() => {
    let cancelled = false;
    void refreshSession().then((result) => {
      if (cancelled) return;
      if (result.kind === "session") setUser(result.session.user);
      setIsRestoring(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Signed in on a phone that already allowed notifications: (re)register
  // it for this account. Asking is left to the moments it's worth it.
  useEffect(() => {
    if (user) void registerForPush({ ask: false }).catch(() => undefined);
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // A refresh made inside any later request — or a session revoked from
  // another device — updates who is signed in here too.
  useEffect(
    () =>
      onSessionChange((session) => {
        setUser(session ? session.user : null);
        if (!session) queryClient.clear();
      }),
    [queryClient],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isRestoring,
      login: async (session) => {
        setAccessToken(session.accessToken);
        if (session.refreshToken) await saveRefreshToken(session.refreshToken);
        setUser(session.user);
      },
      logout: async (allDevices = false) => {
        // First, while the session still works: this phone stops hearing
        // about this account's documents. It never throws.
        await unregisterPush();
        // Then clear locally and unconditionally: if the network call
        // fails, the app must still stop claiming to be signed in. The
        // server call revokes the session so the token can't be reused.
        const refreshToken = await readRefreshToken().catch(() => null);
        setAccessToken(null);
        setUser(null);
        queryClient.clear();
        await clearRefreshToken().catch(() => undefined);
        await api
          .post<void>("/auth/logout", {
            allDevices,
            ...(refreshToken ? { refreshToken } : {}),
          })
          .catch(() => undefined);
      },
      updateUser: (changes) =>
        setUser((current) => (current ? { ...current, ...changes } : current)),
    }),
    [user, isRestoring, queryClient],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
