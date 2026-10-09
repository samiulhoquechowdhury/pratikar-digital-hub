"use client";

import {
  FilePenLine,
  MessageCircle,
  Search,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";

import { Icon } from "@/shared/components/Icon";

type Mode = "find" | "draft" | "ask";

const MODES: Record<
  Mode,
  {
    label: string;
    icon: LucideIcon;
    placeholder: string;
    action: string;
    /** Where the text goes. */
    href: (text: string) => string;
    suggestions: string[];
  }
> = {
  find: {
    label: "Find a document",
    icon: Search,
    placeholder: "e.g. rent agreement, affidavit, legal notice",
    action: "Search",
    href: (text) => `/search?q=${encodeURIComponent(text)}`,
    suggestions: ["Rent agreement", "Affidavit", "Legal notice", "GST"],
  },
  draft: {
    label: "Draft with AI",
    icon: FilePenLine,
    placeholder: "e.g. Partnership deed for two partners in Pune",
    action: "Start drafting",
    href: (text) => `/documents/custom?type=${encodeURIComponent(text)}`,
    suggestions: ["Partnership deed", "Power of attorney", "NDA", "Will"],
  },
  ask: {
    label: "Ask a question",
    icon: MessageCircle,
    placeholder: "e.g. My tenant hasn't paid rent for 3 months",
    action: "Ask",
    href: (text) => `/assistant?q=${encodeURIComponent(text)}`,
    suggestions: [
      "Which document do I need to rent my flat?",
      "How do I send a legal notice?",
    ],
  },
};

/**
 * The hero's one input, three intents. People arrive knowing the document's
 * name ("rent agreement"), knowing only their situation ("my tenant won't
 * pay"), or needing something the catalogue doesn't have — each mode sends
 * the same words to the place that can act on them: search, the assistant,
 * or AI drafting.
 */
export function IntentSearch() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("find");
  const [text, setText] = useState("");
  const inputId = useId();
  const current = MODES[mode];

  const go = (value: string) => {
    const trimmed = value.trim();
    if (trimmed) router.push(current.href(trimmed));
  };

  return (
    <div className="w-full max-w-2xl">
      <div
        role="radiogroup"
        aria-label="What would you like to do?"
        className="inline-flex flex-wrap gap-1 rounded-full border border-white/10 bg-white/5 p-1 backdrop-blur-sm"
      >
        {(Object.keys(MODES) as Mode[]).map((key) => {
          const selected = key === mode;
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setMode(key)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors motion-reduce:transition-none ${
                selected
                  ? "bg-surface text-ink shadow-raised"
                  : "text-ink-inverse-muted hover:text-ink-inverse"
              }`}
            >
              <Icon icon={MODES[key].icon} size="xs" />
              {MODES[key].label}
            </button>
          );
        })}
      </div>

      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          go(text);
        }}
        className="mt-3 flex items-center gap-2 rounded-2xl bg-surface p-2 pl-5 shadow-overlay ring-1 ring-white/10 transition-shadow focus-within:ring-2 focus-within:ring-brand"
      >
        <Icon
          icon={current.icon}
          size="md"
          className="shrink-0 text-ink-subtle"
        />
        <label htmlFor={inputId} className="sr-only">
          {current.label}
        </label>
        <input
          id={inputId}
          type="search"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={current.placeholder}
          className="h-12 min-w-0 flex-1 bg-transparent text-base text-ink placeholder:text-ink-subtle"
        />
        <button
          type="submit"
          className="h-12 shrink-0 rounded-xl bg-brand px-5 text-sm font-semibold text-on-brand transition-colors hover:bg-brand-hover sm:px-7"
        >
          {current.action}
        </button>
      </form>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-sm text-ink-inverse-muted">Try:</span>
        {current.suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => go(suggestion)}
            className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-sm text-ink-inverse-muted transition-colors hover:border-brand/60 hover:text-ink-inverse"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
