"use client";

import {
  ArrowRight,
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
    /** What a phone shows, where three full labels won't fit on one line. */
    short: string;
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
    short: "Find",
    icon: Search,
    placeholder: "e.g. rent agreement, affidavit, legal notice",
    action: "Search",
    href: (text) => `/search?q=${encodeURIComponent(text)}`,
    suggestions: ["Rent agreement", "Affidavit", "Legal notice", "GST"],
  },
  draft: {
    label: "Draft with AI",
    short: "Draft with AI",
    icon: FilePenLine,
    placeholder: "e.g. Partnership deed for two partners in Pune",
    action: "Start drafting",
    href: (text) => `/documents/custom?type=${encodeURIComponent(text)}`,
    suggestions: ["Partnership deed", "Power of attorney", "NDA", "Will"],
  },
  ask: {
    label: "Ask a question",
    short: "Ask",
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
    <div className="flex w-full max-w-2xl flex-col items-center">
      <div
        role="radiogroup"
        aria-label="What would you like to do?"
        className="inline-flex justify-center gap-1 rounded-full border border-line bg-surface/80 p-1 shadow-card backdrop-blur"
      >
        {(Object.keys(MODES) as Mode[]).map((key) => {
          const selected = key === mode;
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={MODES[key].label}
              onClick={() => setMode(key)}
              className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold sm:px-3.5 transition-colors motion-reduce:transition-none ${
                selected
                  ? "bg-primary text-ink-inverse shadow-raised"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              <Icon icon={MODES[key].icon} size="xs" />
              <span className="sm:hidden">{MODES[key].short}</span>
              <span className="hidden sm:inline">{MODES[key].label}</span>
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
        className="mt-4 flex w-full items-center gap-2 rounded-full border border-line-strong bg-surface p-1.5 pl-4 text-left shadow-float transition-[border-color] focus-within:border-primary sm:pl-5"
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
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand text-sm font-semibold text-on-brand transition-colors hover:bg-brand-hover sm:w-auto sm:px-7"
        >
          {/* An arrow on a phone, so the field keeps room for the words. */}
          <Icon
            icon={ArrowRight}
            size="md"
            className="sm:hidden"
            label={current.action}
          />
          <span className="hidden sm:inline">{current.action}</span>
        </button>
      </form>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <span className="text-sm text-ink-subtle">Try:</span>
        {current.suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => go(suggestion)}
            className="rounded-full border border-line bg-surface/70 px-3 py-1 text-sm text-ink-muted transition-colors hover:border-primary hover:text-primary"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
