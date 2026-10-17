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
    placeholder: "Rent agreement, affidavit, legal notice…",
    action: "Search",
    href: (text) => `/search?q=${encodeURIComponent(text)}`,
    suggestions: ["Rent agreement", "Affidavit", "Legal notice", "GST"],
  },
  draft: {
    label: "Draft with AI",
    icon: FilePenLine,
    placeholder: "A partnership deed for two partners in Pune…",
    action: "Start drafting",
    href: (text) => `/documents/custom?type=${encodeURIComponent(text)}`,
    suggestions: ["Partnership deed", "Power of attorney", "NDA", "Will"],
  },
  ask: {
    label: "Ask a question",
    icon: MessageCircle,
    placeholder: "My tenant hasn't paid rent for three months…",
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
 *
 * Set for noir: the modes are small-capital tabs with a gold rule under the
 * chosen one, and the field is a single hairline, like a line on a form.
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
        className="flex gap-6 sm:gap-8"
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
              className={`relative pb-3 text-[0.65rem] font-semibold uppercase tracking-[0.22em] transition-colors sm:text-[0.7rem] ${
                selected ? "text-ivory" : "text-ivory/45 hover:text-ivory/80"
              }`}
            >
              {MODES[key].label}
              <span
                aria-hidden
                className={`absolute inset-x-0 bottom-0 h-px bg-gold-foil transition-transform duration-500 ${
                  selected ? "scale-x-100" : "scale-x-0"
                } origin-left`}
              />
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
        className="mt-6 flex items-center gap-3 border border-ivory/15 bg-white/[0.04] p-2 pl-5 backdrop-blur transition-colors focus-within:border-brand/70"
      >
        <Icon icon={current.icon} size="md" className="shrink-0 text-brand" />
        <label htmlFor={inputId} className="sr-only">
          {current.label}
        </label>
        <input
          id={inputId}
          type="search"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={current.placeholder}
          className="h-12 min-w-0 flex-1 bg-transparent text-base text-ivory placeholder:text-ivory/40"
        />
        <button
          type="submit"
          aria-label={current.action}
          className="btn-gold h-12 shrink-0 !px-4 sm:!px-6"
        >
          <span className="hidden sm:inline">{current.action}</span>
          <Icon icon={ArrowRight} size="sm" />
        </button>
      </form>

      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
        <span className="font-display text-sm italic text-ivory/45">Try</span>
        {current.suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => go(suggestion)}
            className="link-draw text-sm text-ivory/75 transition-colors hover:text-ivory"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
