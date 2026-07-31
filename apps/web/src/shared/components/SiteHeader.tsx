"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { useAuth } from "../providers/AuthProvider";

const NAV = [
  { href: "/documents", label: "Documents" },
  { href: "/content-library", label: "Library" },
  { href: "/courses", label: "Courses" },
  { href: "/verify", label: "Verify" },
];

/**
 * Primary navigation. A client component because it reflects sign-in state;
 * everything else in the shell stays server-rendered.
 */
export function SiteHeader() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Marks the section, not just the exact page, so a detail route keeps its
  // parent tab highlighted.
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      <div className="mx-auto flex h-16 max-w-shell items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 rounded-control text-lg font-semibold tracking-tight text-ink"
        >
          {/* Placeholder mark until the brand assets arrive. */}
          <span
            aria-hidden
            className="grid h-8 w-8 place-items-center rounded-control bg-navy-800 text-sm font-bold text-ink-inverse"
          >
            P
          </span>
          <span className="hidden sm:inline">Pratikar</span>
        </Link>

        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={`rounded-control px-3 py-2 text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? "bg-brand-subtle text-brand"
                      : "text-ink-muted hover:bg-surface-sunken hover:text-ink"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="rounded-control px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink"
              >
                My account
              </Link>
              <button
                type="button"
                onClick={logout}
                className="rounded-control px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-control bg-brand px-4 py-2 text-sm font-semibold text-ink-on-brand transition-colors hover:bg-brand-hover"
            >
              Sign in
            </Link>
          )}

          <button
            type="button"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            onClick={() => setMenuOpen((open) => !open)}
            className="rounded-control p-2 text-ink-muted hover:bg-surface-sunken hover:text-ink md:hidden"
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
        <nav
          id="mobile-nav"
          aria-label="Main"
          className="border-t border-line bg-surface md:hidden"
        >
          <ul className="mx-auto max-w-shell space-y-1 px-4 py-3 sm:px-6">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={`block rounded-control px-3 py-2 text-sm font-medium ${
                    isActive(item.href)
                      ? "bg-brand-subtle text-brand"
                      : "text-ink-muted hover:bg-surface-sunken hover:text-ink"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
