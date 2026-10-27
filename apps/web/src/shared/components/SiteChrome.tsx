"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Pages that stand on their own: signing in is a single task, and the nav,
 * footer and assistant only pull people away from it. The auth panel
 * carries the logo, so there's still a way home.
 */
export const BARE_PATHS = ["/login", "/signup"];

export const isBarePath = (pathname: string | null): boolean =>
  pathname !== null &&
  BARE_PATHS.some((path) => pathname === path || pathname === `${path}/`);

/**
 * The site's header, footer and floating assistant around a page — or just
 * the page, on the BARE_PATHS. The pieces come in as props so they can stay
 * server components.
 */
export function SiteChrome({
  header,
  footer,
  floating,
  children,
}: {
  header: ReactNode;
  footer: ReactNode;
  floating: ReactNode;
  children: ReactNode;
}) {
  const bare = isBarePath(usePathname());
  return (
    <>
      {!bare && header}
      <main id="main" className="flex-1">
        {children}
      </main>
      {!bare && footer}
      {!bare && floating}
    </>
  );
}
