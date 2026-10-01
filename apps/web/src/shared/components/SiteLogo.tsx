import Link from "next/link";

/**
 * The brand lockup. A placeholder mark until the client's brand assets
 * arrive: a navy tile with a gold "P" — gold on navy is 7.86:1, the one way
 * the brand's gold can carry text.
 */
export function SiteLogo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`flex shrink-0 items-center gap-2.5 rounded-control ${className}`}
    >
      <span
        aria-hidden
        className="grid h-8 w-8 place-items-center rounded-control bg-primary font-display text-lg font-bold leading-none text-brand"
      >
        P
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-[0.95rem] font-semibold tracking-tight text-ink">
          Pratikar
        </span>
        <span className="mt-0.5 text-[0.7rem] font-medium text-ink-subtle">
          Digital Hub
        </span>
      </span>
    </Link>
  );
}
