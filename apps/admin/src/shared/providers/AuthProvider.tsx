"use client";

import type { AuthenticatedUser, OtpVerifyResponse } from "@pratikar/types";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { authApi } from "@/features/auth/api/authApi";

import { onSessionChange, refreshSession } from "../lib/apiClient";
import { setAccessToken } from "../lib/authToken";
import { isStaff } from "../lib/staff";

// The staff policy lives in shared/lib/staff — it is applied on two paths
// now (sign-in and cookie restore) and is worth testing without React.
export { STAFF_ROLES, isStaff } from "../lib/staff";

interface AuthContextValue {
  user: AuthenticatedUser | null;
  /** Set when a valid login is rejected for lacking a staff role. */
  accessDeniedFor: AuthenticatedUser | null;
  /**
   * True until the refresh cookie has been checked on first load. Without it
   * the panel renders the sign-in form for a moment on every navigation, to
   * someone who is already signed in.
   */
  isRestoring: boolean;
  login: (result: OtpVerifyResponse) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [accessDeniedFor, setAccessDeniedFor] =
    useState<AuthenticatedUser | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);

  /**
   * Restore the session on load.
   *
   * The access token lives in memory only — deliberately, so an XSS payload
   * can't read it off disk — which means every reload starts signed out until
   * the httpOnly refresh cookie is exchanged for a new one. Until this existed
   * the panel signed staff out on every single refresh, which is what the
   * TODO in shared/lib/apiClient.ts was standing in for.
   */
  useEffect(() => {
    let cancelled = false;

    // No cookie, or an expired or revoked one, is the ordinary state for
    // anyone arriving at the sign-in screen, not an error to surface.
    void refreshSession().then((result) => {
      if (cancelled) return;
      // The same staff check `login` applies. A CUSTOMER can hold a
      // perfectly valid refresh cookie from the storefront — same auth
      // system, same cookie domain in development — and restoring it here
      // would drop them into a shell where every request 403s.
      if (result.kind === "session" && isStaff(result.session.user)) {
        setUser(result.session.user);
      } else if (result.kind === "session") {
        setAccessToken(null);
      }
      setIsRestoring(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Later refreshes — apiClient renews the 15-minute access token when it
   * expires mid-review — keep the panel in step: a session that has ended
   * signs out here, and so does an account that is no longer staff, since
   * the role is re-read from the database on every refresh.
   */
  useEffect(
    () =>
      onSessionChange((session) => {
        if (session && isStaff(session.user)) {
          setUser(session.user);
          return;
        }
        setAccessToken(null);
        setUser(null);
      }),
    [],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessDeniedFor,
      isRestoring,
      login: (result) => {
        // A CUSTOMER can complete the OTP flow perfectly well — it's the same
        // endpoint the storefront uses. Refuse to hold their token here rather
        // than letting them into a shell that 403s on every request.
        if (!isStaff(result.user)) {
          setAccessToken(null);
          setUser(null);
          setAccessDeniedFor(result.user);
          return;
        }
        setAccessToken(result.accessToken);
        setUser(result.user);
        setAccessDeniedFor(null);
      },
      logout: () => {
        // Clear locally first, and unconditionally: if the network call fails,
        // the one thing that must not happen is the panel still claiming to be
        // signed in.
        setAccessToken(null);
        setUser(null);
        setAccessDeniedFor(null);
        // Revoking the session row server-side is what makes this a real sign
        // out. It became load-bearing the moment the restore above existed —
        // a local-only clear would leave the refresh cookie intact, and the
        // next reload would sign the same person straight back in.
        void authApi.logout().catch(() => undefined);
      },
    }),
    [user, accessDeniedFor, isRestoring],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
