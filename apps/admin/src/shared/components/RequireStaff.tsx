"use client";

import { Card } from "@pratikar/ui";

import { StaffLoginForm } from "@/features/auth";
import { useAuth } from "@/shared/providers/AuthProvider";

import { AdminShell } from "./AdminShell";

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
      // Full navy page rather than the shell: there's no navigation worth
      // offering someone who isn't signed in, and an empty sidebar would just
      // be a list of links that all bounce back here.
      <main className="grid min-h-screen place-items-center bg-hero-navy px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center justify-center gap-2.5">
            <span
              aria-hidden
              className="grid h-10 w-10 place-items-center rounded-control bg-brand text-lg font-bold text-on-brand"
            >
              P
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-base font-bold tracking-wide text-ink-inverse">
                PRATIKAR
              </span>
              <span className="text-[0.65rem] font-medium uppercase tracking-[0.18em] text-brand">
                Admin
              </span>
            </span>
          </div>

          <Card className="p-6">
            <h1 className="text-xl">Staff sign-in</h1>
            <p className="mt-1 text-sm text-ink-muted">
              Use the email address linked to your staff account.
            </p>
            <div className="mt-5">
              <StaffLoginForm />
            </div>
          </Card>

          <p className="mt-6 text-center text-xs text-ink-inverse-muted">
            Customer accounts can&apos;t sign in here.
          </p>
        </div>
      </main>
    );
  }

  return <AdminShell>{children}</AdminShell>;
}
