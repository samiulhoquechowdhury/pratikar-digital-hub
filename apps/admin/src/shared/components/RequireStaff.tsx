"use client";

import { ButtonLink, Card } from "@pratikar/ui";
import { usePathname } from "next/navigation";

import { StaffLoginForm } from "@/features/auth";
import { mayOpen } from "@/shared/lib/sections";
import { useAuth } from "@/shared/providers/AuthProvider";

import { AdminShell } from "./AdminShell";

/**
 * Renders the staff login form until a staff account is signed in. Purely a UX
 * gate — every route behind it is independently role-guarded on the API, so
 * bypassing this in the browser gains nothing but 403s.
 *
 * The token is memory-only, so a reload starts signed out and AuthProvider
 * exchanges the httpOnly refresh cookie for a new one. `isRestoring` covers
 * that gap: without it the sign-in form flashes on every reload in front of
 * someone who is, a moment later, signed in.
 */
export function RequireStaff({ children }: { children: React.ReactNode }) {
  const { user, isRestoring } = useAuth();
  const pathname = usePathname();

  if (isRestoring) {
    return (
      <main
        data-surface="inverse"
        className="grid min-h-screen place-items-center bg-hero-navy px-4 py-12"
      >
        {/*
          Deliberately just the mark, with no spinner and no "loading" copy.
          This resolves in well under a second on a warm cookie, and a message
          that appears and vanishes that fast reads as a flicker rather than
          as feedback. Screen readers still get the status.
        */}
        <span role="status" className="sr-only">
          Restoring your session…
        </span>
        <span
          aria-hidden
          className="grid h-10 w-10 place-items-center rounded-control bg-brand text-lg font-bold text-on-brand"
        >
          P
        </span>
      </main>
    );
  }

  if (!user) {
    return (
      // Full navy page rather than the shell: there's no navigation worth
      // offering someone who isn't signed in, and an empty sidebar would just
      // be a list of links that all bounce back here.
      <main
        data-surface="inverse"
        className="grid min-h-screen place-items-center bg-hero-navy px-4 py-12"
      >
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

  // Signed in, but this section isn't one their role uses — say so, rather
  // than render a page whose every request comes back 403.
  if (!mayOpen(user.role, pathname)) {
    return (
      <AdminShell>
        <div className="mx-auto max-w-xl px-6 py-16">
          <Card className="p-6">
            <h1 className="text-xl">Not part of your role</h1>
            <p className="mt-2 text-sm text-ink-muted">
              This section isn&apos;t available to your account. If you need it,
              ask a Super Admin to check your role.
            </p>
            <div className="mt-5">
              <ButtonLink href="/" size="sm" variant="secondary">
                Back to the dashboard
              </ButtonLink>
            </div>
          </Card>
        </div>
      </AdminShell>
    );
  }

  return <AdminShell>{children}</AdminShell>;
}
