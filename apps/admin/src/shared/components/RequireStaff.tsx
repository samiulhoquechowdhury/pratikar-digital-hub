"use client";

import { StaffLoginForm } from "@/features/auth";
import { useAuth } from "@/shared/providers/AuthProvider";

/**
 * Renders the staff login form until a staff account is signed in. Purely a UX
 * gate — every route behind it is independently role-guarded on the API, so
 * bypassing this in the browser gains nothing but 403s.
 *
 * The token is memory-only, so a page refresh lands back here until the
 * /auth/refresh flow is wired.
 */
export function RequireStaff({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  if (!user) {
    return (
      <main>
        <h1>Pratikar Admin</h1>
        <p>Sign in with your staff account.</p>
        <StaffLoginForm />
      </main>
    );
  }

  return <>{children}</>;
}
