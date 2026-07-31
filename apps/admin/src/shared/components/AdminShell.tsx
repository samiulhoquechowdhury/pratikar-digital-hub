"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { useAuth } from "@/shared/providers/AuthProvider";

/**
 * Sidebar rather than the customer site's top bar. Staff move between sections
 * constantly and the section list is long enough that a horizontal nav would
 * either wrap or hide things behind a menu.
 */
const NAV: { href: string; label: string; hint: string }[] = [
  { href: "/templates", label: "Templates", hint: "Document templates" },
  {
    href: "/content-library",
    label: "Content library",
    hint: "E-books, checklists",
  },
  { href: "/courses", label: "Courses", hint: "Courses and modules" },
  {
    href: "/reviews",
    label: "Review queue",
    hint: "Documents awaiting review",
  },
  { href: "/orders", label: "Orders", hint: "Payments and refunds" },
  { href: "/users", label: "Users", hint: "Accounts and roles" },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="flex min-h-screen">
      {/*
        Navy sidebar, matching the customer site's chrome. The working area
        stays light: staff read tables and fill forms here all day, and a dark
        data surface makes both harder.
      */}
      <aside className="hidden w-64 shrink-0 flex-col bg-surface-inverse-deep lg:flex">
        <div className="flex h-16 items-center gap-2.5 border-b border-line-inverse px-5">
          <span
            aria-hidden
            className="grid h-9 w-9 place-items-center rounded-control bg-brand text-base font-bold text-on-brand"
          >
            P
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-sm font-bold tracking-wide text-ink-inverse">
              PRATIKAR
            </span>
            {/* Says "Admin", not "Digital Hub" — staff should never be unsure
                which of the two apps they're looking at. */}
            <span className="text-[0.65rem] font-medium uppercase tracking-[0.18em] text-brand">
              Admin
            </span>
          </span>
        </div>

        <nav aria-label="Sections" className="flex-1 overflow-y-auto p-3">
          <ul className="space-y-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={`block rounded-control px-3 py-2 transition-colors ${
                    isActive(item.href)
                      ? "bg-surface-inverse-raised text-ink-inverse"
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

        <div className="border-t border-line-inverse p-4">
          {/* AuthenticatedUser carries no email — OTP signup doesn't require
              a name either, so fall back rather than render an empty line. */}
          <p className="truncate text-sm font-medium text-ink-inverse">
            {user?.name ?? "Staff account"}
          </p>
          {/* Role is shown permanently: half the buttons in this panel are
              role-gated, so "why can't I refund?" should be answerable at a
              glance rather than by trial and error. */}
          <p className="mt-0.5 text-xs text-brand">{user?.role}</p>
          <button
            type="button"
            onClick={logout}
            className="mt-3 w-full rounded-control border border-line-inverse px-3 py-1.5 text-sm font-medium text-ink-inverse-muted transition-colors hover:bg-surface-inverse-raised hover:text-ink-inverse"
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Small screens get the same nav as a horizontal strip. Staff mostly
            work on desktop, so this is a fallback, not the primary layout. */}
        <nav
          aria-label="Sections"
          className="flex gap-1 overflow-x-auto border-b border-line-inverse bg-surface-inverse-deep px-3 py-2 lg:hidden"
        >
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={`whitespace-nowrap rounded-control px-3 py-1.5 text-sm font-medium ${
                isActive(item.href)
                  ? "bg-surface-inverse-raised text-ink-inverse"
                  : "text-ink-inverse-muted"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
