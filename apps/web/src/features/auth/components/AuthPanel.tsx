"use client";

import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

import { Icon } from "@/shared/components/Icon";
import { SiteLogo } from "@/shared/components/SiteLogo";
import { usePublicConfig } from "@/shared/lib/publicConfig";

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
export function AuthPanel({ mode }: { mode: AuthMode }) {
  const isGoogleSignInEnabled = Boolean(usePublicConfig().googleClientId);
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
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand half: the artwork. Hidden below lg — on a phone it would
          push the form itself below the fold, which is the only thing
          anyone came for. Decorative, so screen readers skip it. */}
      <section className="relative hidden overflow-hidden bg-noir lg:block">
        <Image
          src="/brand/login-art.webp"
          alt=""
          aria-hidden
          fill
          priority
          sizes="50vw"
          className="object-cover object-center"
        />
      </section>

      <section className="flex flex-col items-center justify-center gap-8 bg-paper px-4 py-10 sm:px-6">
        {/* No site header on this page: the logo is the way home. */}
        <div className="flex w-full max-w-md items-center justify-between gap-4">
          <SiteLogo />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink"
          >
            <Icon icon={ArrowLeft} size="xs" />
            Back to home
          </Link>
        </div>
        <div className="w-full max-w-md rounded-2xl border border-ivory-line bg-white p-7 shadow-float sm:p-10">
          <h1 className="text-3xl font-bold text-noir">{copy.heading}</h1>
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
