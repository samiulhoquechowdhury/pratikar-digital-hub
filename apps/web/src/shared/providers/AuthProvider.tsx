"use client";

import type { AuthenticatedUser, AuthSession } from "@pratikar/types";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { apiClient, onSessionChange, refreshSession } from "../lib/apiClient";
import { setAccessToken } from "../lib/authToken";

interface AuthContextValue {
  user: AuthenticatedUser | null;
  /**
   * True until the refresh cookie has been checked on first load. Lets the UI
   * avoid flashing "Log in" at someone who is already signed in.
   */
  isRestoring: boolean;
  login: (result: AuthSession) => void;
  /** Ends this session, or with allDevices every session on the account. */
  logout: (allDevices?: boolean) => Promise<void>;
  /** Applies a change the server has accepted, e.g. a new name. */
  updateUser: (changes: Partial<AuthenticatedUser>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);

  /**
   * Restore the session on load. The access token is held in memory only —
   * deliberately, so an XSS payload can't read it off disk — which means every
   * reload starts signed out until the httpOnly refresh cookie is exchanged
   * for a new one. Without this, signing in would last exactly one page view.
   */
  useEffect(() => {
    let cancelled = false;

    // No cookie, or an expired or revoked one, is the ordinary state for a
    // first-time visitor, not an error worth surfacing.
    void refreshSession().then((result) => {
      if (cancelled) return;
      if (result.kind === "session") setUser(result.session.user);
      setIsRestoring(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Any later refresh — the one apiClient makes when the 15-minute access
   * token expires mid-visit — updates who is signed in, and a session that
   * has ended (revoked, or signed out on another device) signs out here too
   * instead of leaving a header that claims otherwise.
   */
  useEffect(
    () =>
      onSessionChange((session) => {
        setUser(session ? session.user : null);
      }),
    [],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isRestoring,
      login: (result) => {
        setAccessToken(result.accessToken);
        setUser(result.user);
      },
      logout: async (allDevices = false) => {
        // Clear locally first, and unconditionally: if the network call fails,
        // the one thing that must not happen is the UI still claiming to be
        // signed in. The server call revokes the session row and is what makes
        // this a real sign-out rather than a local one — without it the
        // refresh cookie would sign you straight back in on the next reload.
        setAccessToken(null);
        setUser(null);
        await apiClient
          .post<void>("/auth/logout", { allDevices })
          .catch(() => undefined);
      },
      updateUser: (changes) =>
        setUser((current) => (current ? { ...current, ...changes } : current)),
    }),
    [user, isRestoring],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
