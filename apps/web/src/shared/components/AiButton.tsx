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
      className={`inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-full border border-brand-border bg-brand-subtle px-3.5 text-sm font-semibold text-ink transition-colors hover:border-brand ${className}`}
    >
      <Icon icon={Sparkles} className="text-gold-ink" />
      Ask AI
    </Link>
  );
}
