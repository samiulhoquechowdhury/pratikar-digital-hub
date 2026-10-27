"use client";

import { ChevronRight, GraduationCap, Menu, Search, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { NotificationBell } from "@/features/notifications";

import { useAuth } from "../providers/AuthProvider";

import { AccountMenu } from "./AccountMenu";
import { ExploreMenu, OFFERINGS, TOPICS } from "./ExploreMenu";
import { Icon } from "./Icon";
import { SiteLogo } from "./SiteLogo";
import { SiteSearch } from "./SiteSearch";

/**
 * The site header, laid out the way Coursera lays out its own: white, the
 * brand, an Explore menu holding the whole catalogue, a wide search — the
 * main way people arrive at a legal form — and on the right the assistant,
 * the account, and one filled button.
 *
 * On a phone the search folds into an icon that opens it full width, and
 * the menu opens as a sheet.
 *
 * A client component because it reflects sign-in state; the rest of the
 * shell stays server-rendered.
 */
export function SiteHeader() {
  const { user, isRestoring, logout } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Without this the sheet or search stays open over the page you just
  // navigated to.
  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-ivory-line bg-white">
      <div className="mx-auto flex h-[4.5rem] max-w-shell items-center gap-3 px-4 sm:px-6 lg:gap-6 lg:px-8">
        <SiteLogo />

        <div className="hidden lg:block">
          <ExploreMenu />
        </div>

        <Suspense fallback={<div className="hidden flex-1 md:block" />}>
          <SiteSearch className="hidden max-w-xl flex-1 md:block" />
        </Suspense>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            aria-expanded={searchOpen}
            aria-controls="site-search-panel"
            onClick={() => setSearchOpen((open) => !open)}
            className="grid h-10 w-10 place-items-center rounded-full text-noir transition-colors hover:bg-ivory md:hidden"
          >
            <Icon
              icon={searchOpen ? X : Search}
              size="md"
              label={searchOpen ? "Close search" : "Search"}
            />
          </button>

          {/* The assistant has its own floating button on every page. */}
          <Link
            href="/courses"
            className="hidden items-center gap-1.5 rounded-md px-3 py-2 text-[0.9375rem] font-semibold text-noir transition-colors hover:bg-ivory lg:inline-flex"
          >
            <Icon icon={GraduationCap} className="text-gold-ink" />
            Courses
          </Link>

          {isRestoring ? (
            // The session is recovered from an httpOnly cookie on load, so for
            // one moment we genuinely don't know. Holding the space keeps the
            // header from offering "Join for free" to someone signed in.
            <div
              aria-hidden
              className="hidden h-11 w-40 rounded-md bg-ivory sm:block"
            />
          ) : user ? (
            <>
              <Link
                href="/dashboard"
                className="hidden rounded-md px-3 py-2 text-[0.9375rem] font-semibold text-noir transition-colors hover:bg-ivory lg:inline-block"
              >
                My account
              </Link>
              <NotificationBell />
              <AccountMenu user={user} onLogout={() => void logout()} />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden rounded-md px-3 py-2 text-[0.9375rem] font-semibold text-noir transition-colors hover:bg-ivory sm:inline-block"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="btn-noir hidden !px-5 !py-2.5 !text-[0.9375rem] sm:inline-flex"
              >
                Join for free
              </Link>
            </>
          )}

          <button
            type="button"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            onClick={() => setMenuOpen((open) => !open)}
            className="-mr-2 grid h-10 w-10 place-items-center rounded-full text-noir transition-colors hover:bg-ivory lg:hidden"
          >
            <Icon
              icon={menuOpen ? X : Menu}
              size="md"
              label={menuOpen ? "Close menu" : "Open menu"}
            />
          </button>
        </div>
      </div>

      {searchOpen && (
        <div
          id="site-search-panel"
          className="border-t border-ivory-line bg-white px-4 py-4 md:hidden"
        >
          <Suspense fallback={null}>
            <SiteSearch autoFocus onSubmitted={() => setSearchOpen(false)} />
          </Suspense>
        </div>
      )}

      {menuOpen && (
        <div
          id="mobile-nav"
          className="max-h-[calc(100dvh-4.5rem)] overflow-y-auto border-t border-ivory-line bg-white lg:hidden"
        >
          <div className="mx-auto max-w-shell px-4 pb-8 pt-4 sm:px-6">
            {!user && !isRestoring && (
              <div className="grid grid-cols-2 gap-3 pb-5">
                <Link href="/signup" className="btn-noir">
                  Join for free
                </Link>
                <Link href="/login" className="btn-line">
                  Log in
                </Link>
              </div>
            )}

            <nav aria-label="Main">
              <p className="pb-2 text-sm font-semibold text-noir/60">Explore</p>
              <ul className="divide-y divide-ivory-line border-y border-ivory-line">
                {OFFERINGS.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="flex items-center gap-3 py-3.5"
                    >
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-banner-sky text-noir">
                        <Icon icon={item.icon} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold text-noir">
                          {item.label}
                        </span>
                        <span className="block text-sm text-noir/60">
                          {item.hint}
                        </span>
                      </span>
                      <Icon icon={ChevronRight} className="text-noir/40" />
                    </Link>
                  </li>
                ))}
              </ul>

              <p className="mt-6 pb-2 text-sm font-semibold text-noir/60">
                Browse by area of law
              </p>
              <ul className="flex flex-wrap gap-2">
                {TOPICS.map((topic) => (
                  <li key={topic.href}>
                    <Link
                      href={topic.href}
                      className="inline-block rounded-full border border-ivory-line px-3.5 py-1.5 text-sm text-noir hover:border-noir"
                    >
                      {topic.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {user && (
              <Link href="/dashboard" className="btn-line mt-8 w-full">
                My account
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
