"use client";

import { Sparkles } from "lucide-react";
import Link from "next/link";

import { Icon } from "./Icon";

/**
 * The AI assistant entry point.
 *
 * Outlined and navy: gold is reserved for "Sign up" in the header, and the
 * assistant shouldn't outrank it. There is no "Preview" tag any more: the
 * assistant is the real one, and when it's offline its own page says so.
 */
export function AiButton({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/assistant"
      className={`inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full border border-line px-3 text-sm font-medium text-ink transition-colors hover:border-line-strong hover:bg-surface-sunken ${className}`}
    >
      <Icon icon={Sparkles} className="text-primary" />
      Ask AI
    </Link>
  );
}
