"use client";

import { ArrowUpRight, Menu, Search, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { NotificationBell } from "@/features/notifications";

import { COURSES_LIVE } from "../lib/features";
import { useAuth } from "../providers/AuthProvider";

import { AccountMenu } from "./AccountMenu";
import { ExploreMenu, OFFERINGS, TOPICS } from "./ExploreMenu";
import { Icon } from "./Icon";
import { SiteLogo } from "./SiteLogo";
import { SiteSearch } from "./SiteSearch";

/** The header's own links — the catalogue's front doors, in reading order. */
const NAV = [
  { href: "/documents", label: "Documents" },
  { href: "/documents/custom", label: "AI Drafting" },
  { href: "/content-library", label: "Library" },
  { href: "/courses", label: COURSES_LIVE ? "Courses" : "Courses" },
  { href: "/assistant", label: "Assistant" },
];

/** Searches offered under the search panel, as ready-made starting points. */
const POPULAR = [
  "Rent agreement",
  "Affidavit",
  "Legal notice",
  "Partnership deed",
  "Power of attorney",
];

/**
 * The site header: noir, quiet, and the same on every page — the brand, the
 * catalogue's front doors set in small capitals, and on the right the search,
 * the account and one gold invitation.
 *
 * Search opens as a full-width panel under the bar rather than living as a
 * field in it: the bar stays calm, and the search gets the room a serious
 * search deserves — a large field and the searches people run most.
 *
 * A client component because it reflects sign-in state; the rest of the
 * shell stays server-rendered.
 */
export function SiteHeader() {
  const { user, isRestoring, logout } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Without this the drawer or search stays open over the page you just
  // navigated to.
  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  // Escape closes the search panel, as it would a dialog.
  useEffect(() => {
    if (!searchOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSearchOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [searchOpen]);

  const current = (href: string) =>
    href === "/documents"
      ? pathname === "/documents" ||
        (pathname.startsWith("/documents/") &&
          !pathname.startsWith("/documents/custom"))
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header
      data-surface="inverse"
      className="sticky top-0 z-40 border-b border-noir-line bg-noir text-ivory"
    >
      <div className="mx-auto flex h-20 max-w-shell items-center gap-2 px-4 sm:gap-6 sm:px-6 lg:px-8">
        <SiteLogo tone="dark" />

        <nav aria-label="Main" className="ml-4 hidden xl:block">
          <ul className="flex items-center gap-7">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={current(item.href) ? "page" : undefined}
                  className={`link-draw text-[0.7rem] font-semibold uppercase tracking-[0.2em] transition-colors ${
                    current(item.href)
                      ? "bg-[length:100%_1px] text-brand"
                      : "text-ivory/75 hover:text-ivory"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <ExploreMenu />
            </li>
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            aria-expanded={searchOpen}
            aria-controls="site-search-panel"
            onClick={() => setSearchOpen((open) => !open)}
            className="grid h-10 w-10 place-items-center text-ivory/80 sm:h-11 sm:w-11 transition-colors hover:text-ivory"
          >
            <Icon
              icon={searchOpen ? X : Search}
              size="md"
              label={searchOpen ? "Close search" : "Search"}
            />
          </button>

          {isRestoring ? (
            // The session is recovered from an httpOnly cookie on load, so for
            // one moment we genuinely don't know. Holding the space keeps the
            // header from offering "Get started" to someone already signed in.
            <div aria-hidden className="hidden h-11 w-36 bg-white/5 sm:block" />
          ) : user ? (
            <>
              <Link
                href="/dashboard"
                className="link-draw hidden text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-ivory/75 hover:text-ivory lg:inline-block"
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
                className="link-draw hidden px-2 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-ivory/75 hover:text-ivory sm:inline-block"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="btn-gold hidden !px-5 !py-3 sm:inline-flex"
              >
                Get started
              </Link>
            </>
          )}

          <button
            type="button"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            onClick={() => setMenuOpen((open) => !open)}
            className="-mr-2 grid h-10 w-10 place-items-center sm:h-11 sm:w-11 text-ivory/80 transition-colors hover:text-ivory xl:hidden"
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
          className="border-t border-noir-line bg-noir-soft motion-safe:animate-fade-up"
        >
          <div className="mx-auto max-w-shell px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
            <Suspense fallback={null}>
              <SiteSearch
                autoFocus
                variant="panel"
                onSubmitted={() => setSearchOpen(false)}
              />
            </Suspense>
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="mr-2 text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-ivory/50">
                Popular
              </span>
              {POPULAR.map((term) => (
                <Link
                  key={term}
                  href={`/search?q=${encodeURIComponent(term)}`}
                  className="border border-noir-line px-3.5 py-1.5 text-sm text-ivory/80 transition-colors hover:border-brand hover:text-ivory"
                >
                  {term}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {menuOpen && (
        <div
          id="mobile-nav"
          className="max-h-[calc(100dvh-5rem)] overflow-y-auto border-t border-noir-line bg-noir xl:hidden"
        >
          <div className="mx-auto max-w-shell px-4 pb-10 pt-6 sm:px-6">
            <nav aria-label="Main">
              <ul className="divide-y divide-noir-line border-y border-noir-line">
                {NAV.map((item, index) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="group flex items-center justify-between py-4"
                    >
                      <span className="flex items-baseline gap-4">
                        <span className="font-display text-xs italic text-brand">
                          0{index + 1}
                        </span>
                        <span className="font-display text-3xl font-light text-ivory">
                          {item.label}
                        </span>
                      </span>
                      <Icon
                        icon={ArrowUpRight}
                        className="text-ivory/40 transition-colors group-hover:text-brand"
                      />
                    </Link>
                  </li>
                ))}
              </ul>

              <p className="mt-8 text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-ivory/50">
                Everything we offer
              </p>
              <ul className="mt-3 grid gap-1 sm:grid-cols-2">
                {OFFERINGS.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="flex items-center gap-3 py-2 text-sm text-ivory/80 hover:text-ivory"
                    >
                      <Icon icon={item.icon} className="text-brand" />
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>

              <p className="mt-8 text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-ivory/50">
                By area of law
              </p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {TOPICS.map((topic) => (
                  <li key={topic.href}>
                    <Link
                      href={topic.href}
                      className="inline-block border border-noir-line px-3 py-1.5 text-sm text-ivory/80 hover:border-brand hover:text-ivory"
                    >
                      {topic.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {!user && !isRestoring && (
              <div className="mt-10 grid gap-3 sm:grid-cols-2">
                <Link href="/signup" className="btn-gold w-full">
                  Get started
                </Link>
                <Link href="/login" className="btn-line-inverse w-full">
                  Sign in
                </Link>
              </div>
            )}
            {user && (
              <Link href="/dashboard" className="btn-line-inverse mt-10 w-full">
                My account
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
