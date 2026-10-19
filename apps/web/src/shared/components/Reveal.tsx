"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Lets a block rise into place the first time it scrolls into view.
 *
 * Only under `motion-safe`: with reduced motion — or before the script runs
 * — the content is simply there. It never hides anything from a reader or a
 * search engine; it only decides when the entrance plays.
 */
export function Reveal({
  children,
  className = "",
  delay = 0,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  /** Milliseconds, for staggering siblings. */
  delay?: number;
  as?: "div" | "li" | "section";
}) {
  const ref = useRef<HTMLElement>(null);
  const [armed, setArmed] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    // Already on screen at load: no entrance, just show it.
    const box = node.getBoundingClientRect();
    if (box.top < window.innerHeight) return;
    setArmed(true);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as never}
      style={armed ? { transitionDelay: `${delay}ms` } : undefined}
      className={`${
        armed && !shown ? "motion-safe:translate-y-8 motion-safe:opacity-0" : ""
      } transition-[opacity,transform] duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${className}`}
    >
      {children}
    </Tag>
  );
}
