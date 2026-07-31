"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { PRIMARY_NAV } from "../lib/navigation";
import { useAuth } from "../providers/AuthProvider";

import { AccountMenu } from "./AccountMenu";
import { AiButton } from "./AiButton";
import { ExploreMenu } from "./ExploreMenu";
import { SiteSearch } from "./SiteSearch";

/**
 * Primary navigation, laid out the way the big learning platforms do it:
 * brand, one catalogue-wide Explore menu, a search field that takes most of
 * the width, then the account controls on the right.
 *
 * A client component because it reflects sign-in state; the rest of the shell
 * stays server-rendered.
 */
export function SiteHeader() {
  const { user, isRestoring, logout } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Without this the drawer stays open behind the page you just navigated to.
  useEffect(() => setMenuOpen(false), [pathname]);

  // Marks the section, not just the exact page, so a detail route keeps its
  // parent tab highlighted.
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-40 border-b border-line-inverse bg-surface-inverse">
      <div className="mx-auto flex h-16 max-w-shell items-center gap-2 px-4 sm:gap-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5 rounded-control text-ink-inverse"
        >
          {/* Placeholder mark until the brand assets arrive. */}
          <span
            aria-hidden
            className="grid h-9 w-9 place-items-center rounded-control bg-brand text-base font-bold text-on-brand"
          >
            P
          </span>
          <span className="hidden flex-col leading-none sm:flex">
            <span className="text-base font-bold tracking-wide">PRATIKAR</span>
            <span className="text-[0.65rem] font-medium uppercase tracking-[0.18em] text-brand">
              Digital Hub
            </span>
          </span>
        </Link>

        <div className="hidden lg:block">
          <ExploreMenu />
        </div>

        {/* Search takes the slack in the row rather than a fixed width, which
            is what keeps the bar from collapsing awkwardly between breakpoints. */}
        <Suspense fallback={<div className="hidden flex-1 md:block" />}>
          <SiteSearch className="hidden max-w-xl flex-1 md:block" />
        </Suspense>

        <nav aria-label="Main" className="hidden xl:block">
          <ul className="flex items-center gap-0.5">
            {PRIMARY_NAV.slice(0, 3).map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={`rounded-control px-2.5 py-2 text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? "bg-surface-inverse-raised text-brand"
                      : "text-ink-inverse-muted hover:bg-surface-inverse-raised hover:text-ink-inverse"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <AiButton className="hidden sm:inline-flex" />

          {isRestoring ? (
            // The session is recovered from an httpOnly cookie on load, so for
            // one moment we genuinely don't know. Holding the space keeps the
            // header from offering "Sign up" to someone already signed in and
            // then swapping it out under their cursor.
            <div
              aria-hidden
              className="h-9 w-24 rounded-control bg-surface-inverse-raised"
            />
          ) : user ? (
            <AccountMenu user={user} onLogout={logout} />
          ) : (
            <>
              {/* Two buttons, not one. "Sign in" alone reads as a members-only
                  site; the pair is what signals you can join. */}
              <Link
                href="/login"
                className="hidden rounded-control border border-line-inverse px-4 py-2 text-sm font-semibold text-ink-inverse transition-colors hover:bg-surface-inverse-raised sm:inline-block"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-control bg-brand px-4 py-2 text-sm font-semibold text-on-brand transition-colors hover:bg-brand-hover"
              >
                Sign up
              </Link>
            </>
          )}

          <button
            type="button"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            onClick={() => setMenuOpen((open) => !open)}
            className="rounded-control p-2 text-ink-inverse-muted hover:bg-surface-inverse-raised hover:text-ink-inverse lg:hidden"
          >
            <span className="sr-only">
              {menuOpen ? "Close menu" : "Open menu"}
            </span>
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="h-5 w-5"
            >
              {menuOpen ? (
                <path d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div
          id="mobile-nav"
          className="border-t border-line-inverse bg-surface-inverse lg:hidden"
        >
          <div className="mx-auto max-w-shell space-y-4 px-4 py-4 sm:px-6">
            <Suspense fallback={null}>
              <SiteSearch
                className="md:hidden"
                onSubmitted={() => setMenuOpen(false)}
              />
            </Suspense>

            <nav aria-label="Main">
              <ul className="space-y-1">
                {PRIMARY_NAV.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={isActive(item.href) ? "page" : undefined}
                      className={`block rounded-control px-3 py-2 ${
                        isActive(item.href)
                          ? "bg-surface-inverse-raised text-brand"
                          : "text-ink-inverse-muted hover:bg-surface-inverse-raised hover:text-ink-inverse"
                      }`}
                    >
                      <span className="block text-sm font-medium">
                        {item.label}
                      </span>
                      <span className="mt-0.5 block text-xs text-ink-inverse-muted/70">
                        {item.hint}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="flex flex-wrap items-center gap-2 border-t border-line-inverse pt-4">
              <AiButton className="sm:hidden" />
              {!user && !isRestoring && (
                <Link
                  href="/login"
                  className="rounded-control border border-line-inverse px-4 py-2 text-sm font-semibold text-ink-inverse sm:hidden"
                >
                  Log in
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
