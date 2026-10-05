"use client";

import { Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { apiClient } from "../lib/apiClient";

import { Icon } from "./Icon";

/**
 * Whether the assistant answers for real. Asked once per page load and
 * shared by every Ask AI button, rather than once per button.
 */
let statusRequest: Promise<boolean> | null = null;
const assistantIsLive = () =>
  (statusRequest ??= apiClient
    .get<{ assistant: boolean }>("/ai/status")
    .then((status) => status.assistant)
    // Unknown is treated as live: a missing badge is a smaller error than
    // calling a working assistant a preview.
    .catch(() => true));

/**
 * The AI assistant entry point.
 *
 * Outlined and navy: gold is reserved for "Sign up" in the header, and the
 * assistant shouldn't outrank it. The "Preview" tag appears only while the
 * assistant has no model behind it and answers from a script — then the
 * label is the truth; once it's live, the label would be a false modesty.
 */
export function AiButton({ className = "" }: { className?: string }) {
  const [isPreview, setIsPreview] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void assistantIsLive().then((live) => {
      if (!cancelled) setIsPreview(!live);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Link
      href="/assistant"
      className={`inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full border border-line px-3 text-sm font-medium text-ink transition-colors hover:border-line-strong hover:bg-surface-sunken ${className}`}
    >
      <Icon icon={Sparkles} className="text-primary" />
      Ask AI
      {isPreview && (
        <span className="rounded-full bg-primary-subtle px-1.5 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wide text-primary">
          Preview
        </span>
      )}
    </Link>
  );
}
