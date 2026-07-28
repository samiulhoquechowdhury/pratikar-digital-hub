"use client";

import type { AuthenticatedUser, OtpVerifyResponse } from "@pratikar/types";
import { createContext, useContext, useMemo, useState } from "react";

import { setAccessToken } from "../lib/authToken";

interface AuthContextValue {
  user: AuthenticatedUser | null;
  login: (result: OtpVerifyResponse) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      login: (result) => {
        setAccessToken(result.accessToken);
        setUser(result.user);
      },
      logout: () => {
        setAccessToken(null);
        setUser(null);
      },
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
