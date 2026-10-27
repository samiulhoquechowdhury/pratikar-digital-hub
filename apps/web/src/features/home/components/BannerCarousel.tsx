"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

/** How long each banner stays before the next, when rotating. */
const INTERVAL_MS = 7000;

export interface Banner {
  id: string;
  /** Read out with the slide's position — "AI drafting, 1 of 5". */
  label: string;
  content: ReactNode;
}

/**
 * Coursera's hero: one large banner at a time, rotating on its own, with
 * dots to pick one.
 *
 * Moving content a reader can't stop is an accessibility failure, so with
 * no pause button, rotation stops while the pointer is over it or focus is
 * inside it, never starts for people who've asked for reduced motion, and
 * stops for good once someone picks a banner. The banners themselves are
 * server-rendered and handed in.
 */
export function BannerCarousel({ banners }: { banners: Banner[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [reduced, setReduced] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const count = banners.length;

  const go = useCallback(
    (next: number) => setIndex(((next % count) + count) % count),
    [count],
  );

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const onChange = () => setReduced(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  const rotating = count > 1 && !paused && !hovered && !reduced;

  useEffect(() => {
    if (!rotating) return;
    const timer = setTimeout(() => go(index + 1), INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [rotating, index, go]);

  if (count === 0) return null;

  return (
    <div
      ref={root}
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={(event) => {
        if (!root.current?.contains(event.relatedTarget)) setHovered(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") go(index + 1);
        if (event.key === "ArrowLeft") go(index - 1);
      }}
      className="relative"
    >
      {/* Every banner is laid out in the same cell, so the frame is as tall
          as the tallest one and never jumps between slides. */}
      <div className="grid">
        {banners.map((banner, i) => {
          const current = i === index;
          return (
            <div
              key={banner.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${banner.label}, ${i + 1} of ${count}`}
              aria-hidden={!current}
              inert={!current || undefined}
              className={`col-start-1 row-start-1 transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none ${
                current
                  ? "z-10 translate-x-0 opacity-100"
                  : "pointer-events-none translate-x-4 opacity-0"
              }`}
            >
              {banner.content}
            </div>
          );
        })}
      </div>

      {count > 1 && (
        <div className="mt-5 flex items-center justify-center">
          <div className="flex items-center gap-2">
            {banners.map((banner, i) => (
              <button
                key={banner.id}
                type="button"
                aria-label={`Show ${banner.label}`}
                aria-current={i === index ? "true" : undefined}
                onClick={() => {
                  // Picking one is taking control: stop rotating.
                  setPaused(true);
                  go(i);
                }}
                className="group grid h-6 place-items-center"
              >
                <span
                  className={`relative block h-2 overflow-hidden rounded-full transition-all duration-300 ${
                    i === index
                      ? "w-10 bg-noir/15"
                      : "w-2 bg-noir/25 group-hover:bg-noir/50"
                  }`}
                >
                  {i === index && (
                    <span
                      key={`${index}-${rotating}`}
                      className={`absolute inset-y-0 left-0 rounded-full bg-noir ${
                        rotating
                          ? "animate-[progress_7s_linear_forwards]"
                          : "w-full"
                      }`}
                    />
                  )}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
