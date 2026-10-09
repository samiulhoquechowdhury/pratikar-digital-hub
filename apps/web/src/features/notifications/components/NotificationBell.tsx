"use client";

import { Bell } from "lucide-react";
import Link from "next/link";

import { Icon } from "@/shared/components/Icon";
import { useDismissable } from "@/shared/hooks/useDismissable";

import { useInbox } from "../hooks/useInbox";

/** "5 min ago", "3 h ago", "2 Oct" — an inbox needs relative, not exact. */
export function timeAgo(iso: string, now = Date.now()): string {
  const minutes = Math.floor((now - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

/**
 * The in-app inbox: a bell in the header with an unread count, opening the
 * latest updates — "sent for review", "your document is ready". It is the
 * record every other channel points at, so it works with push turned off.
 */
export function NotificationBell() {
  const { inbox, markRead } = useInbox();
  const { isOpen, setIsOpen, containerRef } = useDismissable<HTMLDivElement>();
  const unread = inbox.unread;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        data-menu-trigger
        aria-expanded={isOpen}
        aria-haspopup="true"
        onClick={() => setIsOpen((open) => !open)}
        className="relative grid h-10 w-10 place-items-center rounded-full text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink"
      >
        <Icon icon={Bell} size="md" />
        <span className="sr-only">
          Notifications{unread > 0 ? `, ${unread} unread` : ""}
        </span>
        {unread > 0 && (
          <span
            aria-hidden
            className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-danger px-1 text-[0.625rem] font-bold leading-none text-ink-inverse"
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-card border border-line bg-surface shadow-overlay">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="text-sm font-semibold text-ink">Notifications</p>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => void markRead()}
                className="text-xs font-medium text-primary hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          {inbox.items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-ink-muted">
              Nothing yet. We&apos;ll let you know here when a document is
              ready.
            </p>
          ) : (
            <ul className="max-h-96 divide-y divide-line overflow-y-auto">
              {inbox.items.map((item) => {
                const body = (
                  <>
                    <span className="flex items-start gap-2">
                      {!item.readAt && (
                        <span
                          aria-hidden
                          className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary"
                        />
                      )}
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-ink">
                          {item.title}
                        </span>
                        <span className="mt-0.5 block text-sm leading-snug text-ink-muted">
                          {item.body}
                        </span>
                        <span className="mt-1 block text-xs text-ink-subtle">
                          {timeAgo(item.createdAt)}
                        </span>
                      </span>
                    </span>
                  </>
                );
                const className = `block px-4 py-3 transition-colors hover:bg-surface-sunken ${item.readAt ? "" : "bg-brand-subtle/40"}`;
                const open = () => {
                  setIsOpen(false);
                  if (!item.readAt) void markRead([item.id]);
                };
                return (
                  <li key={item.id}>
                    {item.href ? (
                      <Link
                        href={item.href}
                        onClick={open}
                        className={className}
                      >
                        {body}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={open}
                        className={`w-full text-left ${className}`}
                      >
                        {body}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          <Link
            href="/dashboard/settings#notifications"
            onClick={() => setIsOpen(false)}
            className="block border-t border-line px-4 py-2.5 text-center text-xs font-medium text-ink-muted hover:bg-surface-sunken hover:text-ink"
          >
            Notification settings
          </Link>
        </div>
      )}
    </div>
  );
}
