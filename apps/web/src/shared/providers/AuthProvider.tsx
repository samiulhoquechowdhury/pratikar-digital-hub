"use client";

import type { AuthenticatedUser, AuthSession } from "@pratikar/types";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { apiClient } from "../lib/apiClient";
import { setAccessToken } from "../lib/authToken";

interface AuthContextValue {
  user: AuthenticatedUser | null;
  /**
   * True until the refresh cookie has been checked on first load. Lets the UI
   * avoid flashing "Log in" at someone who is already signed in.
   */
  isRestoring: boolean;
  login: (result: AuthSession) => void;
  logout: () => void;
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

    apiClient
      .post<{ accessToken: string; user: AuthenticatedUser }>("/auth/refresh")
      .then((session) => {
        if (cancelled) return;
        setAccessToken(session.accessToken);
        setUser(session.user);
      })
      // No cookie, or an expired or revoked one. That's the ordinary state for
      // a first-time visitor, not an error worth surfacing.
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setIsRestoring(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isRestoring,
      login: (result) => {
        setAccessToken(result.accessToken);
        setUser(result.user);
      },
      logout: () => {
        // Clear locally first, and unconditionally: if the network call fails,
        // the one thing that must not happen is the UI still claiming to be
        // signed in. The server call revokes the session row and is what makes
        // this a real sign-out rather than a local one — without it the
        // refresh cookie would sign you straight back in on the next reload.
        setAccessToken(null);
        setUser(null);
        void apiClient
          .post<void>("/auth/logout", { allDevices: false })
          .catch(() => undefined);
      },
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
