"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

import "./globals.css";

/**
 * The last resort, for an error in the root layout itself — the header,
 * the auth provider. It replaces the whole page, so it brings its own <html>
 * and keeps to plain markup: whatever broke the layout may break anything
 * the layout would have provided.
 *
 * Before this, such an error left a blank white screen and nobody heard
 * about it. Now the customer gets a way back, and the error is reported.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-surface px-4 font-sans text-ink">
        <main className="max-w-md text-center">
          <h1 className="text-3xl">Something went wrong</h1>
          <p className="mt-4 text-base text-ink-muted">
            The page couldn&apos;t load. It has been reported to us. Try again,
            or go back to the home page.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <button
              type="button"
              onClick={reset}
              className="rounded-control bg-brand px-5 py-2.5 text-sm font-semibold text-on-brand hover:bg-brand-hover"
            >
              Try again
            </button>
            {/* A plain link rather than next/link: the router may be what
                failed. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              className="rounded-control border border-line-strong px-5 py-2.5 text-sm font-semibold text-ink hover:bg-surface-sunken"
            >
              Home page
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
