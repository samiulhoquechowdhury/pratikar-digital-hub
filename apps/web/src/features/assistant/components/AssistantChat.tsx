"use client";

import { Button } from "@pratikar/ui";
import { formatPaise, grossPaise } from "@pratikar/utils";
import {
  ArrowRight,
  ArrowUp,
  FilePenLine,
  Languages,
  RotateCcw,
  Search,
  Sparkles,
  Square,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Icon } from "@/shared/components/Icon";

import {
  assistantApi,
  ChatError,
  CHAT_LIMITS,
  type ChatFailure,
  type ChatSource,
  type ChatTurn,
} from "../api/assistantApi";

interface Message {
  id: number;
  role: "you" | "assistant";
  text: string;
  sources?: ChatSource[];
  /** The assistant offered a custom draft; carries the question it was for. */
  draftFor?: string;
  /** Still arriving. */
  streaming?: boolean;
}

/** What to say when a live answer didn't come back. */
const FAILURE_REPLIES: Record<ChatFailure, string> = {
  busy: "I'm getting a lot of questions right now. Please try again in a moment.",
  "too-fast":
    "You're asking faster than I can keep up. Wait a minute, then try again.",
  failed:
    "Something went wrong on our side. Please try again, or browse Documents, Courses and the Library directly.",
  "not-configured":
    "The assistant is offline right now. You can still search the site or draft a document yourself.",
};

/**
 * The answer as it should be read: the [n] citation markers and the
 * [draft] offer marker are for the page, not the reader — the cited items
 * and the drafting offer appear as cards underneath instead.
 */
export function cleanAnswer(text: string): string {
  return text
    .replace(/\s?\[(\d{1,2}|draft)\]/gi, "")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

/** The conversation as the API wants it: plain text, oldest first. */
const toTurns = (messages: Message[], question: string): ChatTurn[] => [
  ...messages
    .filter((m) => m.text.trim())
    .map((m) => ({
      role: m.role === "you" ? ("user" as const) : ("assistant" as const),
      content: m.role === "you" ? m.text : cleanAnswer(m.text),
    })),
  { role: "user", content: question },
];

/**
 * The site assistant: a real conversation, answered by Claude from what this
 * site sells (retrieval over every published course, template, form,
 * checklist and e-book), streamed as it's written.
 *
 * No canned questions — people arrive with their own situation, and the
 * welcome says what it can do rather than guessing what they'll ask. It
 * points at material and offers advocate-reviewed drafting; it never gives
 * advice on someone's own case, and the banner says so for as long as the
 * chat is open.
 */
export function AssistantChat({
  /**
   * Shell classes. The page embeds it as a bordered card with its own height;
   * the floating panel fills its parent instead, so the frame comes from
   * whichever container is using it rather than being baked in here.
   */
  className = "h-[min(70vh,44rem)] rounded-card border border-line shadow-card",
  autoFocus = false,
}: {
  className?: string;
  autoFocus?: boolean;
} = {}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [offline, setOffline] = useState(false);
  const nextId = useRef(0);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  // Knowing up front means an offline assistant says so before anyone types,
  // rather than after their first question.
  useEffect(() => {
    let cancelled = false;
    assistantApi
      .status()
      .then(({ assistant }) => {
        if (!cancelled && !assistant) setOffline(true);
      })
      .catch(() => {
        // Unknown: let the first question find out.
      });
    return () => {
      cancelled = true;
      abortRef.current?.abort();
    };
  }, []);

  // Keep the newest message in view, but never fight someone who has scrolled
  // up to re-read — only stick to the bottom when already near it.
  useEffect(() => {
    const log = logRef.current;
    if (!log) return;
    const nearBottom =
      log.scrollHeight - log.scrollTop - log.clientHeight < 160;
    if (nearBottom) log.scrollTo({ top: log.scrollHeight });
  }, [messages]);

  /** Changes the assistant message with this id. */
  const patch = (id: number, change: (m: Message) => Partial<Message>) =>
    setMessages((all) =>
      all.map((m) => (m.id === id ? { ...m, ...change(m) } : m)),
    );

  const send = (text: string) => {
    const question = text.trim().slice(0, CHAT_LIMITS.maxTurnLength);
    if (!question || busy) return;

    const turns = toTurns(messages, question);
    const replyId = nextId.current + 1;
    nextId.current += 2;
    setMessages((m) => [
      ...m,
      { id: replyId - 1, role: "you", text: question },
      { id: replyId, role: "assistant", text: "", streaming: true },
    ]);
    setDraft("");
    setBusy(true);

    const abort = new AbortController();
    abortRef.current = abort;

    const finish = () => {
      setBusy(false);
      abortRef.current = null;
      inputRef.current?.focus();
    };

    assistantApi
      .stream(
        turns,
        (event) => {
          switch (event.type) {
            case "delta":
              patch(replyId, (m) => ({ text: m.text + event.text }));
              break;
            case "reset":
              patch(replyId, () => ({ text: "" }));
              break;
            case "done":
              patch(replyId, () => ({
                text: event.answer,
                sources: event.sources,
                draftFor: event.suggestDraft ? question : undefined,
                streaming: false,
              }));
              break;
            case "error":
              patch(replyId, () => ({
                text: FAILURE_REPLIES[
                  event.reason === "AI_BUSY" ? "busy" : "failed"
                ],
                streaming: false,
              }));
              break;
          }
        },
        abort.signal,
      )
      .catch((error: unknown) => {
        const reason = error instanceof ChatError ? error.reason : "failed";
        if (reason === "not-configured") setOffline(true);
        patch(replyId, () => ({
          text: FAILURE_REPLIES[reason],
          streaming: false,
        }));
      })
      .finally(() => {
        // Stopped by the customer: keep what had arrived.
        patch(replyId, (m) => ({
          streaming: false,
          text: m.text || (abort.signal.aborted ? "Stopped." : m.text),
        }));
        finish();
      });
  };

  const stop = () => abortRef.current?.abort();

  const startOver = () => {
    stop();
    setMessages([]);
  };

  const started = messages.length > 0;

  return (
    <div className={`flex flex-col overflow-hidden bg-surface ${className}`}>
      {/* The limits, persistent on purpose: this sits on a legal site. */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-brand-border bg-brand-subtle px-4 py-2.5">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gold-ink">
          <Icon icon={Sparkles} size="xs" /> AI assistant
        </span>
        <p className="text-xs text-ink-muted">
          {offline
            ? "Offline right now."
            : "Answers from our catalogue, and can be wrong. Not legal advice."}
        </p>
        {started && (
          <button
            type="button"
            onClick={startOver}
            className="ml-auto inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted hover:text-ink"
          >
            <Icon icon={RotateCcw} size="xs" /> Start over
          </button>
        )}
      </div>

      <div
        ref={logRef}
        // A log, so a screen reader announces replies as they arrive without
        // yanking focus out of the box someone is typing in.
        role="log"
        aria-live="polite"
        aria-label="Conversation"
        className="flex-1 space-y-5 overflow-y-auto px-4 py-6 sm:px-6"
      >
        {!started && (offline ? <Offline /> : <Welcome />)}

        {messages.map((message) =>
          message.role === "you" ? (
            <p key={message.id} className="flex justify-end">
              <span className="max-w-[85%] whitespace-pre-wrap rounded-card rounded-br-sm bg-primary px-4 py-2.5 text-sm leading-relaxed text-ink-inverse">
                {message.text}
              </span>
            </p>
          ) : (
            <Reply key={message.id} message={message} />
          ),
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(draft);
        }}
        className="border-t border-line bg-canvas p-3 sm:p-4"
      >
        <div className="flex items-end gap-2 rounded-card border border-line-strong bg-surface p-2 focus-within:border-brand">
          <label htmlFor="assistant-input" className="sr-only">
            Ask a question
          </label>
          <textarea
            id="assistant-input"
            ref={inputRef}
            rows={1}
            value={draft}
            disabled={offline}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              // Enter sends, Shift+Enter breaks the line — the convention
              // people already have from every other chat box.
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(draft);
              }
            }}
            placeholder={
              offline
                ? "The assistant is offline"
                : "Describe your situation or what you need…"
            }
            maxLength={CHAT_LIMITS.maxTurnLength}
            className="max-h-32 min-h-[2.25rem] flex-1 resize-none bg-transparent px-2 py-1.5 text-base text-ink placeholder:text-ink-subtle focus:outline-none disabled:cursor-not-allowed"
          />
          {busy ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={stop}
              className="!px-2.5 !py-2"
            >
              <Icon icon={Square} />
              <span className="sr-only">Stop</span>
            </Button>
          ) : (
            <Button
              type="submit"
              size="sm"
              disabled={!draft.trim() || offline}
              className="!px-2.5 !py-2"
            >
              <Icon icon={ArrowUp} />
              <span className="sr-only">Send</span>
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

const CAPABILITIES = [
  {
    icon: Search,
    text: "Finds the right course, document template, legal form or e-book for what you're dealing with.",
  },
  {
    icon: FilePenLine,
    text: "Can't find your document? It sets up a custom draft, which an advocate reviews before you download it.",
  },
  {
    icon: Languages,
    text: "Ask in English, Hindi or your own language.",
  },
];

function Welcome() {
  return (
    <div>
      <h2 className="text-lg">What do you need help with?</h2>
      <p className="mt-1 max-w-prose text-sm leading-relaxed text-ink-muted">
        Tell me about your situation in your own words — the more detail, the
        better I can point you to the right thing.
      </p>
      <ul className="mt-5 space-y-3">
        {CAPABILITIES.map((item) => (
          <li key={item.text} className="flex gap-3 text-sm text-ink-muted">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary-subtle text-primary">
              <Icon icon={item.icon} size="xs" />
            </span>
            <span className="pt-1 leading-relaxed">{item.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Offline() {
  return (
    <div>
      <h2 className="text-lg">The assistant is offline right now</h2>
      <p className="mt-1 max-w-prose text-sm leading-relaxed text-ink-muted">
        You can still find everything yourself, or have a document drafted and
        reviewed by an advocate.
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        {[
          { href: "/search", label: "Search the site" },
          { href: "/documents", label: "Document templates" },
          { href: "/content-library", label: "Forms & e-books" },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-control border border-line-strong bg-surface px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:border-brand-border hover:bg-brand-subtle"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function Reply({ message }: { message: Message }) {
  const text = cleanAnswer(message.text);
  const paragraphs = text.split(/\n+/).filter((p) => p.trim());

  return (
    <div className="flex gap-3">
      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-subtle text-gold-ink">
        <Icon icon={Sparkles} size="xs" />
      </span>
      <div className="min-w-0 flex-1 space-y-3">
        {paragraphs.length === 0 && message.streaming ? (
          <Thinking />
        ) : (
          paragraphs.map((p, i) => (
            <p key={i} className="max-w-prose text-sm leading-relaxed text-ink">
              {p}
              {message.streaming && i === paragraphs.length - 1 && (
                <span
                  aria-hidden
                  className="ml-0.5 inline-block h-3.5 w-1.5 translate-y-0.5 animate-pulse bg-ink-subtle motion-reduce:animate-none"
                />
              )}
            </p>
          ))
        )}

        {message.sources && message.sources.length > 0 && (
          <ul className="grid gap-2 pt-1 sm:grid-cols-2">
            {message.sources.map((source) => (
              <li key={source.sourceType + source.sourceId}>
                <SourceCard source={source} />
              </li>
            ))}
          </ul>
        )}

        {message.draftFor && (
          <Link
            href={`/documents/custom?type=${encodeURIComponent(message.draftFor.slice(0, 120))}`}
            className="group flex items-center gap-3 rounded-card border border-brand-border bg-brand-subtle px-4 py-3 transition-colors hover:bg-brand-subtle/70"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand text-on-brand">
              <Icon icon={FilePenLine} size="sm" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-ink">
                Draft it with AI
              </span>
              <span className="block text-xs text-ink-muted">
                Free to draft and preview · reviewed by an advocate before
                download
              </span>
            </span>
            <Icon
              icon={ArrowRight}
              className="text-ink-subtle transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        )}
      </div>
    </div>
  );
}

/** One recommended item: its kind, title and price — the whole card links. */
function SourceCard({ source }: { source: ChatSource }) {
  return (
    <div className="h-full rounded-card border border-line bg-surface p-3 transition-colors hover:border-brand-border">
      <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-ink-subtle">
        {source.kind}
      </p>
      <Link
        href={source.href}
        className="mt-1 line-clamp-2 block text-sm font-semibold leading-snug text-ink hover:text-primary"
      >
        {source.title}
      </Link>
      <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <span className="font-semibold tabular-nums text-ink">
          {formatPaise(grossPaise(source.priceInPaise))}
        </span>
        <span className="text-ink-subtle">incl. GST</span>
        {source.sourceType === "template" && (
          // A template can be filled in by conversation too: straight into
          // that tab, so the conversation carries on where it started.
          <Link
            href={`${source.href}?fill=chat`}
            className="font-medium text-primary hover:underline"
          >
            Fill in by chat
          </Link>
        )}
      </p>
    </div>
  );
}

function Thinking() {
  return (
    // aria-hidden: the log announces the reply when it lands, and announcing
    // "thinking" first would just talk over it.
    <span aria-hidden className="flex items-center gap-1 py-2">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink-subtle motion-reduce:animate-none"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </span>
  );
}
