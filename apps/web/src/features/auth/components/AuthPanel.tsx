"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

import { isGoogleSignInEnabled } from "../lib/googleIdentity";
import { safeRedirectPath } from "../lib/redirect";

import { GoogleSignInButton } from "./GoogleSignInButton";
import { OtpForm } from "./OtpForm";

export type AuthMode = "signin" | "signup";

const COPY: Record<AuthMode, { heading: string; sub: string }> = {
  signin: {
    heading: "Welcome back",
    sub: "Sign in to reach your documents, courses, and purchases.",
  },
  signup: {
    heading: "Create your account",
    sub: "Free to join. You only pay when you generate a document or enrol in a course.",
  },
};

/**
 * Both /login and /signup render this. The distinction is copy only — OTP
 * verification and Google sign-in each create the account on first use, so
 * there is no separate registration to perform and no way for someone to land
 * on the "wrong" one and get stuck.
 */
const PROMISES = [
  "Documents drafted from templates a lawyer has vetted",
  "Certificate courses with a code anyone can verify",
  "One account for documents, courses, and the library",
];

export function AuthPanel({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const next = safeRedirectPath(searchParams.get("next"));

  const handleSignedIn = useCallback(() => {
    // replace, not push: the back button should return to whatever sent them
    // here, not to a sign-in form they've already completed.
    router.replace(next);
  }, [router, next]);

  const copy = COPY[mode];

  return (
    <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-2">
      {/* Brand half. Hidden below lg: on a phone it would push the form
          itself below the fold, which is the only thing anyone came for. */}
      <section className="hidden bg-hero-navy lg:flex lg:flex-col lg:justify-center lg:px-12 xl:px-20">
        <div className="max-w-md">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
            Pratikar Digital Hub
          </p>
          <h2 className="mt-4 text-3xl text-ink-inverse">
            Legal knowledge in every home.
          </h2>
          <ul className="mt-8 space-y-4">
            {PROMISES.map((promise) => (
              <li key={promise} className="flex gap-3">
                <span
                  aria-hidden
                  className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand text-xs font-bold text-on-brand"
                >
                  ✓
                </span>
                <span className="text-sm leading-relaxed text-ink-inverse-muted">
                  {promise}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="flex items-center justify-center bg-canvas px-4 py-12 sm:px-6">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl">{copy.heading}</h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            {copy.sub}
          </p>

          {isGoogleSignInEnabled && (
            <>
              <div className="mt-8">
                <GoogleSignInButton onSignedIn={handleSignedIn} />
              </div>

              <div className="my-6 flex items-center gap-3">
                <span aria-hidden className="h-px flex-1 bg-line" />
                <span className="text-xs font-medium uppercase tracking-wider text-ink-subtle">
                  or
                </span>
                <span aria-hidden className="h-px flex-1 bg-line" />
              </div>
            </>
          )}

          <div className={isGoogleSignInEnabled ? "" : "mt-8"}>
            <OtpForm onVerified={handleSignedIn} />
          </div>

          <p className="mt-8 text-center text-sm text-ink-muted">
            {mode === "signin" ? (
              <>
                New here?{" "}
                <Link
                  href="/signup"
                  className="font-semibold text-primary hover:text-primary-hover"
                >
                  Create an account
                </Link>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-primary hover:text-primary-hover"
                >
                  Sign in
                </Link>
              </>
            )}
          </p>

          <p className="mt-6 text-center text-xs leading-relaxed text-ink-subtle">
            Pratikar Digital Hub provides document templates and educational
            material. It is not a law firm and does not provide legal advice.
          </p>
        </div>
      </section>
    </div>
  );
}
