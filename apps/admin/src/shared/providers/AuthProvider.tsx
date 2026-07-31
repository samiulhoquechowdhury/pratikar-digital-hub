"use client";

import type { AuthenticatedUser, OtpVerifyResponse } from "@pratikar/types";
import { Role } from "@pratikar/types";
import { createContext, useContext, useMemo, useState } from "react";

import { setAccessToken } from "../lib/authToken";

/**
 * Roles allowed into the admin panel at all. Mirrors the @Roles() guards on the
 * staff-only API routes (docs/srs.md Section 6) — this is a UX gate, not a
 * security boundary: the API rejects a CUSTOMER token regardless of what the
 * client renders.
 */
export const STAFF_ROLES: readonly Role[] = [
  Role.CONTENT_MANAGER,
  Role.ADMIN,
  Role.SUPER_ADMIN,
];

export const isStaff = (user: AuthenticatedUser | null): boolean =>
  user !== null && STAFF_ROLES.includes(user.role);

interface AuthContextValue {
  user: AuthenticatedUser | null;
  /** Set when a valid login is rejected for lacking a staff role. */
  accessDeniedFor: AuthenticatedUser | null;
  login: (result: OtpVerifyResponse) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [accessDeniedFor, setAccessDeniedFor] =
    useState<AuthenticatedUser | null>(null);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessDeniedFor,
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
        setAccessToken(null);
        setUser(null);
        setAccessDeniedFor(null);
      },
    }),
    [user, accessDeniedFor],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
