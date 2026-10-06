import { BrandMark } from "@pratikar/ui";
import Link from "next/link";

/**
 * The brand lockup, from the client's logo: the P-column mark, "PRATIKAR"
 * in a classical capital serif with the gold gradient, "DIGITAL HUB" spaced
 * out beneath.
 *
 * Two tones. On navy it matches the artwork — a white mark, bright gold. On
 * white the mark turns navy and the gold deepens, or both would wash out.
 */
export function SiteLogo({
  className = "",
  tone = "light",
}: {
  className?: string;
  tone?: "light" | "dark";
}) {
  const dark = tone === "dark";
  return (
    <Link
      href="/"
      aria-label="Pratikar Digital Hub — home"
      className={`flex shrink-0 items-center gap-2.5 rounded-control ${className}`}
    >
      <BrandMark
        className={`h-9 w-auto ${dark ? "text-ink-inverse" : "text-primary"}`}
      />
      <span
        aria-hidden
        className={`h-8 w-px ${dark ? "bg-ink-inverse/40" : "bg-line-strong"}`}
      />
      <span aria-hidden className="flex flex-col leading-none">
        <span
          className={`bg-gradient-to-b bg-clip-text font-brand text-[1.15rem] font-semibold tracking-[0.04em] text-transparent ${
            dark
              ? "from-wordmark-dark-from to-wordmark-dark-to"
              : "from-wordmark-light-from to-wordmark-light-to"
          }`}
        >
          PRATIKAR
        </span>
        <span
          className={`mt-1 text-[0.56rem] font-semibold tracking-[0.32em] ${
            dark ? "text-ink-inverse" : "text-primary"
          }`}
        >
          DIGITAL HUB
        </span>
      </span>
    </Link>
  );
}
