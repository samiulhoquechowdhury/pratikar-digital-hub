"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Open/close state for a menu that hangs off a button.
 *
 * Escape and click-outside are both here because a dropdown that only closes
 * when you click the button again is a trap on touch devices, and one that
 * ignores Escape strands keyboard users inside it.
 */
export function useDismissable<T extends HTMLElement = HTMLDivElement>() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<T>(null);

  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (target && !containerRef.current?.contains(target)) setIsOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setIsOpen(false);
      // Focus goes back to whatever opened the menu; without this it falls to
      // the body and the next Tab starts from the top of the page.
      const trigger = containerRef.current?.querySelector<HTMLElement>(
        "[data-menu-trigger]",
      );
      trigger?.focus();
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  return { isOpen, setIsOpen, containerRef };
}
