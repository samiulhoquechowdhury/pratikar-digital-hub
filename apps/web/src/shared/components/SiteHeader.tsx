"use client";

import { Menu, Search, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { PRIMARY_NAV } from "../lib/navigation";
import { useAuth } from "../providers/AuthProvider";

import { AccountMenu } from "./AccountMenu";
import { AiButton } from "./AiButton";
import { Icon } from "./Icon";
import { SiteLogo } from "./SiteLogo";
import { SiteSearch } from "./SiteSearch";

/**
 * Primary navigation: brand, four sections, search, account.
 *
 * Light, with a hairline border and a slight translucency so the page reads
 * as continuous rather than boxed under a band of colour. Navy carries the
 * brand here as text and the logo tile; gold is spent on one thing only —
 * "Sign up" — so the one action that matters most is the one thing in the
 * header with colour.
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
  // parent highlighted.
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-surface/90 backdrop-blur-md supports-[backdrop-filter]:bg-surface/75">
      <div className="mx-auto flex h-16 max-w-shell items-center gap-8 px-4 sm:px-6 lg:px-8">
        <SiteLogo />

        <nav aria-label="Main" className="hidden h-full lg:block">
          <ul className="flex h-full items-center gap-1">
            {PRIMARY_NAV.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.href} className="h-full">
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`relative inline-flex h-full items-center whitespace-nowrap px-3 text-sm font-medium transition-colors ${
                      active ? "text-ink" : "text-ink-muted hover:text-ink"
                    }`}
                  >
                    {item.label}
                    {/* An underline, not a filled pill: it marks where you
                        are without competing with the page for attention. */}
                    {active && (
                      <span
                        aria-hidden
                        className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-primary"
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {/* The field only where there's room for it; below that, a link to
              the search page, which has its own box. Squeezing a field in
              between is what pushed "Sign up" onto two lines. */}
          <Suspense fallback={<div className="hidden w-60 xl:block" />}>
            <SiteSearch className="hidden w-60 xl:block" />
          </Suspense>
          <Link
            href="/search"
            className="hidden h-9 w-9 place-items-center rounded-full text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink md:grid xl:hidden"
          >
            <Icon icon={Search} label="Search" />
          </Link>

          <AiButton className="hidden sm:inline-flex" />

          {isRestoring ? (
            // The session is recovered from an httpOnly cookie on load, so for
            // one moment we genuinely don't know. Holding the space keeps the
            // header from offering "Sign up" to someone already signed in and
            // then swapping it out under their cursor.
            <div
              aria-hidden
              className="h-9 w-24 rounded-control bg-surface-sunken"
            />
          ) : user ? (
            <AccountMenu user={user} onLogout={logout} />
          ) : (
            <>
              {/* Two buttons, not one. "Sign in" alone reads as a members-only
                  site; the pair is what signals you can join. */}
              <Link
                href="/login"
                className="hidden whitespace-nowrap rounded-control px-3 py-2 text-sm font-semibold text-ink transition-colors hover:bg-surface-sunken sm:inline-block"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="whitespace-nowrap rounded-control bg-brand px-4 py-2 text-sm font-semibold text-on-brand transition-colors hover:bg-brand-hover"
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
            className="-mr-2 grid h-11 w-11 place-items-center rounded-control text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink lg:hidden"
          >
            <Icon
              icon={menuOpen ? X : Menu}
              size="md"
              label={menuOpen ? "Close menu" : "Open menu"}
            />
          </button>
        </div>
      </div>

      {menuOpen && (
        <div
          id="mobile-nav"
          className="border-t border-line bg-surface shadow-raised lg:hidden"
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
                      className={`block rounded-control px-3 py-2.5 transition-colors ${
                        isActive(item.href)
                          ? "bg-primary-subtle"
                          : "hover:bg-surface-sunken"
                      }`}
                    >
                      <span className="block text-base font-medium text-ink">
                        {item.label}
                      </span>
                      <span className="mt-0.5 block text-sm text-ink-muted">
                        {item.hint}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
              <AiButton className="sm:hidden" />
              {!user && !isRestoring && (
                <Link
                  href="/login"
                  className="rounded-control border border-line-strong px-4 py-2 text-sm font-semibold text-ink sm:hidden"
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
