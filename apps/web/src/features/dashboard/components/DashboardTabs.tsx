"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

export interface DashboardTab {
  id: string;
  label: string;
  /** Shown beside the label — the size of the list behind the tab. */
  count: number;
  panel: ReactNode;
}

/**
 * Three lists, one at a time.
 *
 * They used to be stacked down a single page: documents as full-width cards,
 * courses as a two-column grid, purchases as a six-column table. Three
 * different shapes in a row is what made the page feel disorganised — nothing
 * told you where one thing ended and the next began, and finding a purchase
 * meant scrolling past everything else.
 *
 * ── THE HASH STILL WORKS ──────────────────────────────────────────────────
 * The account menu in the header links to /dashboard#documents, #courses and
 * #purchases. Those were anchors to headings; they now select a tab, so the
 * links keep doing what they promise. Selecting a tab writes the hash back
 * with replaceState, so it survives a reload without stacking history
 * entries every time someone glances at another tab.
 */
export function DashboardTabs({ tabs }: { tabs: DashboardTab[] }) {
  const [active, setActive] = useState(tabs[0]?.id ?? "");
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Honour the incoming hash, and keep listening: clicking "My purchases" in
  // the header while already on the dashboard changes only the hash, which
  // fires no navigation.
  useEffect(() => {
    const apply = () => {
      const id = window.location.hash.replace("#", "");
      if (tabs.some((t) => t.id === id)) setActive(id);
    };
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, [tabs]);

  const select = (id: string) => {
    setActive(id);
    window.history.replaceState(null, "", `#${id}`);
  };

  /**
   * Arrow keys move between tabs, which is what a tablist is expected to do —
   * without it, a keyboard user has to Tab through every tab to reach the
   * panel. Home and End jump to the ends.
   */
  const onKeyDown = (event: React.KeyboardEvent, index: number) => {
    const moves: Record<string, number> = {
      ArrowRight: index + 1,
      ArrowLeft: index - 1,
      Home: 0,
      End: tabs.length - 1,
    };
    const next = moves[event.key];
    if (next === undefined) return;
    event.preventDefault();
    const target = tabs[(next + tabs.length) % tabs.length];
    if (!target) return;
    select(target.id);
    tabRefs.current[target.id]?.focus();
  };

  return (
    <div>
      <div
        role="tablist"
        aria-label="Your account"
        className="flex gap-1 overflow-x-auto border-b border-line"
      >
        {tabs.map((tab, index) => {
          const selected = tab.id === active;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                tabRefs.current[tab.id] = el;
              }}
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`panel-${tab.id}`}
              // Roving tabindex: one stop for the whole tablist, then arrow
              // keys within it.
              tabIndex={selected ? 0 : -1}
              onClick={() => select(tab.id)}
              onKeyDown={(e) => onKeyDown(e, index)}
              className={`-mb-px flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                selected
                  ? "border-brand text-ink"
                  : "border-transparent text-ink-muted hover:border-line-strong hover:text-ink"
              }`}
            >
              {tab.label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-xs tabular-nums ${
                  selected
                    ? "bg-brand-subtle text-gold-ink"
                    : "bg-surface-sunken text-ink-subtle"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`panel-${tab.id}`}
          aria-labelledby={`tab-${tab.id}`}
          hidden={tab.id !== active}
          // Focusable so that tabbing out of the tablist lands in the content
          // it controls rather than skipping past it.
          tabIndex={0}
          className="pt-6"
        >
          {tab.id === active && tab.panel}
        </div>
      ))}
    </div>
  );
}
