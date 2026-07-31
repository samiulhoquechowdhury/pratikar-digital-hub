"use client";

import type { AuthenticatedUser } from "@pratikar/types";
import Link from "next/link";

import { useDismissable } from "../hooks/useDismissable";

const ACCOUNT_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard#documents", label: "My documents" },
  { href: "/dashboard#courses", label: "My courses" },
  { href: "/dashboard#purchases", label: "Purchases" },
];

/** First letter of the name, or of the role — never an empty circle. */
const initial = (user: AuthenticatedUser) =>
  (user.name?.trim()[0] ?? "A").toUpperCase();

export function AccountMenu({
  user,
  onLogout,
}: {
  user: AuthenticatedUser;
  onLogout: () => void;
}) {
  const { isOpen, setIsOpen, containerRef } = useDismissable<HTMLDivElement>();

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        data-menu-trigger
        aria-expanded={isOpen}
        aria-haspopup="true"
        onClick={() => setIsOpen((open) => !open)}
        className="flex items-center gap-2 rounded-full p-0.5 pr-2 text-ink-inverse-muted transition-colors hover:text-ink-inverse"
      >
        <span className="sr-only">Account menu</span>
        <span
          aria-hidden
          className="grid h-8 w-8 place-items-center rounded-full bg-brand text-sm font-bold text-on-brand"
        >
          {initial(user)}
        </span>
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="h-3.5 w-3.5"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-card border border-line bg-surface py-2 shadow-overlay">
          <div className="border-b border-line px-4 pb-2">
            <p className="truncate text-sm font-semibold text-ink">
              {user.name ?? "Your account"}
            </p>
            {/* Staff sometimes browse the customer site signed in as
                themselves; showing the role saves a trip to the admin panel
                to work out which account they're on. */}
            {user.role !== "CUSTOMER" && (
              <p className="mt-0.5 text-xs text-ink-subtle">{user.role}</p>
            )}
          </div>

          <ul className="py-1">
            {ACCOUNT_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-2 text-sm text-ink transition-colors hover:bg-surface-sunken"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="border-t border-line pt-1">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className="block w-full px-4 py-2 text-left text-sm text-ink transition-colors hover:bg-surface-sunken"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
