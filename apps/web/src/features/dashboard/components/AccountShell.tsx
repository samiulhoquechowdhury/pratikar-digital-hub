"use client";

import {
  Alert,
  Button,
  ButtonLink,
  EmptyState,
  Skeleton,
  SkeletonList,
} from "@pratikar/ui";
import { UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, type ReactNode } from "react";

import { Icon } from "@/shared/components/Icon";
import { useAuth } from "@/shared/providers/AuthProvider";

import {
  useDashboardData,
  type DashboardData,
} from "../hooks/useDashboardData";
import { ACCOUNT_NAV, isActive } from "../lib/accountNav";

interface AccountContextValue {
  data: DashboardData;
  reload: () => Promise<void>;
}

const AccountContext = createContext<AccountContextValue | null>(null);

/**
 * The account's documents, enrolments and orders, for any account page.
 *
 * Loaded once by the layout rather than by each page: moving between "My
 * courses" and "Orders" is then instant, and a purchase made on one page is
 * visible on the next without a second fetch.
 */
export function useAccount(): AccountContextValue {
  const value = useContext(AccountContext);
  if (!value) throw new Error("useAccount must be used inside AccountShell");
  return value;
}

/** Up to two initials, for the avatar. */
const initialsOf = (name: string | null) =>
  (name ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";

/**
 * The account area's frame: who you are across the top, the account's pages
 * down the side, and the page itself beside them — the layout learners know
 * from Coursera and Udemy's "My learning".
 *
 * Signing in, loading and a failed load are handled here once, so each page
 * only ever renders with its data in hand.
 */
export function AccountShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const { data, isLoading, error, reload } = useDashboardData();

  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-line bg-paper">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-32 -z-10 h-80 w-80 rounded-full bg-[radial-gradient(closest-side,rgb(212_175_55/0.18),transparent)]"
        />
        <div className="mx-auto flex max-w-shell items-center gap-4 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <span
            aria-hidden
            className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-primary font-display text-xl font-bold text-brand shadow-raised"
          >
            {user ? initialsOf(user.name) : <Icon icon={UserRound} size="lg" />}
          </span>
          <div className="min-w-0">
            <p className="eyebrow">Your account</p>
            <h1 className="mt-1 truncate text-3xl text-ink sm:text-4xl">
              {user?.name
                ? `Welcome back, ${user.name.split(" ")[0]}`
                : "Welcome"}
            </h1>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-shell grid-cols-[minmax(0,1fr)] gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[14rem_minmax(0,1fr)] lg:px-8 lg:py-10">
        <nav aria-label="Account">
          {/* A scrolling row on phones, a sticky column on desktop. */}
          <ul className="relative -mx-4 flex gap-1 overflow-x-auto px-4 pb-1 lg:sticky lg:top-32 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
            {ACCOUNT_NAV.map((item) => {
              const active = isActive(item.href, pathname);
              return (
                <li key={item.href} className="shrink-0">
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors lg:rounded-xl ${
                      active
                        ? "bg-primary text-ink-inverse"
                        : "text-ink-muted hover:bg-paper hover:text-ink"
                    }`}
                  >
                    <Icon
                      icon={item.icon}
                      className={active ? "text-brand" : ""}
                    />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="min-w-0">
          {isLoading ? (
            <AccountSkeleton />
          ) : !user ? (
            <EmptyState
              title="Sign in to see your account"
              description="Your documents, courses, library and invoices all live here."
              action={
                <ButtonLink
                  href={`/login?next=${encodeURIComponent(pathname)}`}
                >
                  Sign in
                </ButtonLink>
              }
            />
          ) : error ? (
            <Alert tone="danger" role="alert">
              <div className="flex flex-wrap items-center gap-4">
                <span>{error}</span>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => void reload()}
                >
                  Try again
                </Button>
              </div>
            </Alert>
          ) : data ? (
            <AccountContext.Provider value={{ data, reload }}>
              {children}
            </AccountContext.Provider>
          ) : null}
        </div>
      </div>
    </>
  );
}

/** One account page's heading: what it holds, and an action if it has one. */
export function AccountPageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
      <div>
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="mt-1 text-sm text-ink-muted">{description}</p>
      </div>
      {action}
    </div>
  );
}

function AccountSkeleton() {
  return (
    <div role="status" aria-busy="true" className="space-y-6">
      <span className="sr-only">Loading your account…</span>
      <Skeleton className="h-7 w-48" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
      <SkeletonList rows={3} label="Loading your account…" />
    </div>
  );
}
