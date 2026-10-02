"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { useAuth } from "../providers/AuthProvider";

import { AccountMenu } from "./AccountMenu";
import { AiButton } from "./AiButton";
import { ExploreMenu, OFFERINGS, TOPICS } from "./ExploreMenu";
import { Icon } from "./Icon";
import { SiteLogo } from "./SiteLogo";
import { SiteSearch } from "./SiteSearch";

/** The category bar under the header — the catalogue's sections, Udemy-style. */
const CATEGORY_BAR = [
  { href: "/documents", label: "Document generator" },
  { href: "/content-library?shelf=forms", label: "Legal forms" },
  { href: "/content-library?shelf=checklists", label: "Checklists" },
  { href: "/content-library?shelf=ebooks", label: "E-books" },
  { href: "/courses", label: "Courses" },
  { href: "/assistant", label: "AI assistant" },
  { href: "/verify", label: "Verify a certificate" },
];

/**
 * The site header, laid out the way Coursera and Udemy lay theirs out: the
 * brand, an Explore menu holding the whole catalogue, a wide search — the
 * main way people arrive at a legal form — and the account. A slim bar
 * beneath lists the catalogue's sections on wide screens.
 *
 * Gold is spent on one thing only, "Sign up", so the action that matters
 * most is the one thing in the header with colour.
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

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur-md supports-[backdrop-filter]:bg-surface/85">
      <div className="mx-auto flex h-16 max-w-shell items-center gap-3 px-4 sm:px-6 lg:gap-5 lg:px-8">
        <SiteLogo />

        <div className="hidden lg:block">
          <ExploreMenu />
        </div>

        <Suspense fallback={<div className="hidden flex-1 md:block" />}>
          <SiteSearch className="hidden flex-1 md:block" />
        </Suspense>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
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
            <>
              <Link
                href="/dashboard"
                className="hidden whitespace-nowrap rounded-control px-3 py-2 text-sm font-semibold text-ink transition-colors hover:bg-surface-sunken lg:inline-block"
              >
                My account
              </Link>
              <AccountMenu user={user} onLogout={() => void logout()} />
            </>
          ) : (
            <>
              {/* Two buttons, not one. "Log in" alone reads as a members-only
                  site; the pair is what signals you can join. */}
              <Link
                href="/login"
                className="hidden whitespace-nowrap rounded-control border border-line-strong px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-surface-sunken sm:inline-block"
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

      {/* The bar reads the shelf from the query string, which Next only
          allows inside a Suspense boundary; the fallback is the same bar
          with nothing marked, so the header never shifts. */}
      <Suspense fallback={<CategoryBar shelf={null} pathname={pathname} />}>
        <CategoryBarWithShelf pathname={pathname} />
      </Suspense>

      {menuOpen && (
        <div
          id="mobile-nav"
          className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-line bg-surface shadow-raised lg:hidden"
        >
          <div className="mx-auto max-w-shell space-y-5 px-4 py-4 sm:px-6">
            <Suspense fallback={null}>
              <SiteSearch
                className="md:hidden"
                onSubmitted={() => setMenuOpen(false)}
              />
            </Suspense>

            <nav aria-label="Main">
              <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-ink-subtle">
                What we offer
              </p>
              <ul className="space-y-0.5">
                {OFFERINGS.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="flex items-center gap-3 rounded-control px-3 py-2.5 transition-colors hover:bg-surface-sunken"
                    >
                      <Icon icon={item.icon} className="text-primary" />
                      <span>
                        <span className="block text-base font-medium text-ink">
                          {item.label}
                        </span>
                        <span className="block text-sm text-ink-muted">
                          {item.hint}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="mt-4 px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-ink-subtle">
                Browse by topic
              </p>
              <ul className="flex flex-wrap gap-2 px-3">
                {TOPICS.map((topic) => (
                  <li key={topic.href}>
                    <Link
                      href={topic.href}
                      className="inline-block rounded-full border border-line px-3 py-1.5 text-sm text-ink hover:border-line-strong"
                    >
                      {topic.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
              {user && (
                <Link
                  href="/dashboard"
                  className="rounded-control border border-line-strong px-4 py-2 text-sm font-semibold text-ink"
                >
                  My account
                </Link>
              )}
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

function CategoryBarWithShelf({ pathname }: { pathname: string }) {
  const shelf = useSearchParams().get("shelf");
  return <CategoryBar shelf={shelf} pathname={pathname} />;
}

function CategoryBar({
  shelf,
  pathname,
}: {
  shelf: string | null;
  pathname: string;
}) {
  /** Current when its path — and its shelf, if it names one — match. */
  const isCurrent = (href: string) => {
    const [path, query] = href.split("?");
    if (pathname !== path && !pathname.startsWith(`${path}/`)) return false;
    const wanted = new URLSearchParams(query ?? "").get("shelf");
    return wanted ? shelf === wanted : true;
  };

  return (
    <nav aria-label="Sections" className="hidden border-t border-line lg:block">
      <ul className="mx-auto flex h-11 max-w-shell items-center gap-1 px-4 sm:px-6 lg:px-8">
        {CATEGORY_BAR.map((item) => {
          const current = isCurrent(item.href);
          return (
            <li key={item.href} className="h-full">
              <Link
                href={item.href}
                aria-current={current ? "page" : undefined}
                className={`relative inline-flex h-full items-center whitespace-nowrap px-3 text-sm transition-colors ${
                  current
                    ? "font-semibold text-ink"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                {item.label}
                {current && (
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
  );
}
