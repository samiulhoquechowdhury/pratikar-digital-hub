import Link from "next/link";

/**
 * The AI assistant entry point.
 *
 * Gold-outlined rather than gold-filled: a solid gold button is the primary
 * action on this site (see the design tokens), and the assistant shouldn't
 * outrank "Sign up" in the header. The outline keeps it obviously special
 * without taking the top slot.
 *
 * The "Soon" tag is not decoration. The assistant is Milestone 4 and isn't
 * built, and a prominent header button that silently leads to an apology is
 * worse than one that says so up front.
 */
export function AiButton({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/assistant"
      className={`group inline-flex items-center gap-2 rounded-full border border-brand/50 bg-brand/10 px-3.5 py-2 text-sm font-semibold text-brand transition-colors hover:bg-brand hover:text-on-brand ${className}`}
    >
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-4 w-4"
      >
        <path d="M12 2l1.9 5.6L19.5 9l-5.6 1.9L12 16.5l-1.9-5.6L4.5 9l5.6-1.4L12 2z" />
        <path d="M18.5 14l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9.9-2.6z" />
      </svg>
      Ask AI
      <span className="rounded-full bg-surface-inverse-deep px-1.5 py-0.5 text-[0.625rem] font-bold uppercase tracking-wide text-ink-inverse-muted group-hover:bg-on-brand group-hover:text-brand">
        Soon
      </span>
    </Link>
  );
}
