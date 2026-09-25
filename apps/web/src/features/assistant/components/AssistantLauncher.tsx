"use client";

import { Sparkles, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { Icon } from "@/shared/components/Icon";

import { AssistantChat } from "./AssistantChat";

/**
 * The floating assistant, available from every page.
 *
 * ── THE MOTION IS SPATIAL, NOT DECORATIVE ─────────────────────────────────
 * The panel grows out of the button that opened it — `transform-origin` is
 * the bottom-right corner, where the launcher sits — so it reads as that
 * control expanding rather than a dialog appearing from nowhere. Exit runs at
 * roughly two-thirds of the enter duration, which is what makes dismissing
 * feel responsive while opening still feels considered.
 *
 * Only transform and opacity are animated, so it composites on the GPU and
 * never reflows the page behind it. `prefers-reduced-motion` drops the
 * movement and keeps the state change instant — the panel still opens, it
 * just stops travelling.
 */

/** Enter, then exit at ~65% of it. Exit must also outlast the unmount timer. */
const ENTER_MS = 280;
const EXIT_MS = 180;

export function AssistantLauncher() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // Kept mounted through the exit so the closing animation can play out.
  const [present, setPresent] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<number | undefined>(undefined);

  const close = useCallback(() => {
    setOpen(false);
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setPresent(false), EXIT_MS);
    // Focus goes back where it came from, or the page loses the user's place.
    buttonRef.current?.focus();
  }, []);

  const openPanel = () => {
    window.clearTimeout(closeTimer.current);
    setPresent(true);
    // Next frame, so the element exists in its closed state first and the
    // browser has something to animate from.
    requestAnimationFrame(() => setOpen(true));
  };

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  // Escape closes, which is the one dismissal every dialog owes the keyboard.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  // Close on route change: the panel is fixed to the viewport, so without
  // this it would hang over whatever page you navigated to.
  useEffect(() => {
    if (present) close();
    // Only pathname — including `close` or `present` would re-run this on
    // every open and slam it shut again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // The assistant page is the assistant; a launcher for it there is clutter.
  if (pathname === "/assistant") return null;

  return (
    <>
      {present && (
        <>
          {/*
            Scrim on small screens only. On a phone the panel is nearly
            full-height and the page behind it is not usable anyway; on a
            desktop the panel is a corner window and dimming the whole site
            for it would be heavy-handed.
          */}
          <div
            aria-hidden
            onClick={close}
            className={`fixed inset-0 z-40 bg-surface-inverse-deep/40 transition-opacity duration-200 motion-reduce:transition-none sm:hidden ${
              open ? "opacity-100" : "opacity-0"
            }`}
          />

          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Pratikar assistant"
            style={{
              transitionDuration: `${open ? ENTER_MS : EXIT_MS}ms`,
              // Out-and-settle on the way in; a plain ease-out on the way out,
              // because overshooting while leaving reads as indecision.
              transitionTimingFunction: open
                ? "cubic-bezier(0.16, 1, 0.3, 1)"
                : "cubic-bezier(0.4, 0, 1, 1)",
            }}
            className={`fixed inset-x-3 bottom-[5.5rem] z-50 flex max-h-[min(78vh,42rem)] origin-bottom-right flex-col overflow-hidden rounded-card border border-line bg-surface shadow-overlay transition-[opacity,transform] motion-reduce:transition-none sm:inset-x-auto sm:right-6 sm:w-[26rem] ${
              open
                ? "translate-y-0 scale-100 opacity-100"
                : "pointer-events-none translate-y-3 scale-95 opacity-0"
            }`}
          >
            <div className="flex items-center justify-between gap-3 border-b border-line bg-canvas px-4 py-3">
              <p className="text-sm font-semibold text-ink">
                Pratikar assistant
              </p>
              <button
                type="button"
                onClick={close}
                className="grid h-8 w-8 place-items-center rounded-control text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink"
              >
                <Icon icon={X} />
                <span className="sr-only">Close the assistant</span>
              </button>
            </div>

            <div className="min-h-0 flex-1">
              <AssistantChat className="h-full" autoFocus={open} />
            </div>
          </div>
        </>
      )}

      <button
        ref={buttonRef}
        type="button"
        onClick={() => (present ? close() : openPanel())}
        aria-expanded={present}
        aria-haspopup="dialog"
        className="group fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-full bg-brand py-3.5 pl-4 pr-5 text-sm font-semibold text-on-brand shadow-overlay transition-[transform,background-color] duration-200 hover:scale-105 hover:bg-brand-hover active:scale-95 motion-reduce:transition-none motion-reduce:hover:scale-100"
      >
        {/*
          A pill rather than a bare circle, because "Ask AI" is what the
          header calls it and an unlabelled icon makes people guess. The star
          is the same mark as the header's AI button — drawn, not an emoji, so
          it takes the button's colour and looks identical on every device.

          Both glyphs are stacked in one fixed box and cross-faded, so the
          button never renders empty mid-swap and the label never jumps
          sideways as the icon changes.
        */}
        <span aria-hidden className="relative grid h-5 w-5 place-items-center">
          <Icon
            icon={Sparkles}
            size="md"
            className={`absolute transition-[opacity,transform] duration-200 motion-reduce:transition-none ${
              present
                ? "rotate-90 scale-75 opacity-0"
                : "rotate-0 scale-100 opacity-100"
            }`}
          />
          <Icon
            icon={X}
            size="md"
            className={`absolute transition-[opacity,transform] duration-200 motion-reduce:transition-none ${
              present
                ? "rotate-0 scale-100 opacity-100"
                : "-rotate-90 scale-75 opacity-0"
            }`}
          />
        </span>
        {present ? "Close" : "Ask AI"}
      </button>
    </>
  );
}
