import { Sparkles } from "lucide-react";
import Link from "next/link";

import { Icon } from "./Icon";

/**
 * The AI assistant entry point.
 *
 * Outlined and navy: gold is reserved for "Sign up" in the header, and the
 * assistant shouldn't outrank it. The "Preview" tag is not decoration — the
 * answers are scripted until the RAG chatbot ships, and the label says so.
 */
export function AiButton({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/assistant"
      className={`inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full border border-line px-3 text-sm font-medium text-ink transition-colors hover:border-line-strong hover:bg-surface-sunken ${className}`}
    >
      <Icon icon={Sparkles} className="text-primary" />
      Ask AI
      <span className="rounded-full bg-primary-subtle px-1.5 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wide text-primary">
        Preview
      </span>
    </Link>
  );
}
