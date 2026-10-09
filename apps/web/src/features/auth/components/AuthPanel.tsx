"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

import { Icon } from "@/shared/components/Icon";

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
  "Documents from templates a lawyer has vetted",
  "See a watermarked preview before you pay",
  "Forms, checklists and e-books to download and keep",
  "One account for everything you buy, with GST invoices",
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

  // Switching between sign-in and sign-up keeps the destination: someone sent
  // here by "Sign in to buy" who turns out to be new should still land back
  // on the thing they were buying, not on the home page.
  const withNext = (path: string) =>
    searchParams.get("next")
      ? `${path}?next=${encodeURIComponent(next)}`
      : path;

  return (
    <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-2">
      {/* Brand half. Hidden below lg: on a phone it would push the form
          itself below the fold, which is the only thing anyone came for. */}
      <section className="relative hidden overflow-hidden bg-surface-inverse lg:flex lg:flex-col lg:justify-center lg:px-12 xl:px-20">
        {/* The hero's light and grid, so signing in feels like the same
            place as the home page rather than a utility screen. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(40rem_28rem_at_100%_0%,theme(colors.navy.600),transparent_70%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(theme(colors.navy.700)_1px,transparent_1px),linear-gradient(90deg,theme(colors.navy.700)_1px,transparent_1px)] [background-size:56px_56px] opacity-40 [mask-image:radial-gradient(60%_60%_at_30%_50%,black,transparent)]"
        />
        <div className="relative max-w-md">
          <p className="text-sm font-semibold text-brand">
            Har Ghar Mein Kanooni Gyaan
          </p>
          <p className="mt-4 font-display text-4xl font-semibold leading-tight text-ink-inverse xl:text-5xl">
            Legal knowledge in <span className="text-brand">every home.</span>
          </p>
          <ul className="mt-10 space-y-4">
            {PROMISES.map((promise) => (
              <li key={promise} className="flex gap-3">
                <span
                  aria-hidden
                  className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand text-on-brand"
                >
                  <Icon icon={Check} size="xs" />
                </span>
                <span className="text-base leading-relaxed text-ink-inverse-muted">
                  {promise}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="flex items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-sm">
          <h1 className="text-3xl">{copy.heading}</h1>
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
                  href={withNext("/signup")}
                  className="font-semibold text-primary hover:text-primary-hover"
                >
                  Create an account
                </Link>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <Link
                  href={withNext("/login")}
                  className="font-semibold text-primary hover:text-primary-hover"
                >
                  Sign in
                </Link>
              </>
            )}
          </p>

          <p className="mt-6 text-center text-xs leading-relaxed text-ink-subtle">
            By continuing, you agree to our{" "}
            <Link href="/terms" className="underline hover:text-ink">
              Terms of Use
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline hover:text-ink">
              Privacy Policy
            </Link>
            . Pratikar Digital Hub provides document templates and educational
            material. It is not a law firm and does not provide legal advice.
          </p>
        </div>
      </section>
    </div>
  );
}
