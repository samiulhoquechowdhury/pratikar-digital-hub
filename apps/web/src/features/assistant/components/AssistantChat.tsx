"use client";

import { Button } from "@pratikar/ui";
import { formatPaise, grossPaise } from "@pratikar/utils";
import { ArrowUp, RotateCcw, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Icon } from "@/shared/components/Icon";

import {
  assistantApi,
  ChatError,
  CHAT_LIMITS,
  type ChatFailure,
  type ChatReply,
  type ChatTurn,
} from "../api/assistantApi";
import {
  answerById,
  answerFor,
  STARTER_QUESTIONS,
  type DemoAnswer,
} from "../lib/demoScript";

interface Message {
  id: number;
  role: "you" | "assistant";
  text?: string;
  answer?: DemoAnswer;
}

/** Long enough to read as thinking, short enough not to feel broken. */
const THINKING_MS = 550;

/**
 * "live" asks the API; "preview" answers from the script. The chat starts
 * live and drops to preview for the rest of the visit the first time the
 * server says it has no model configured — so the site behaves the same
 * today as before, and upgrades itself the day the key is set.
 */
type Mode = "live" | "preview";

/** What to say when a live answer didn't come back. */
const FAILURE_REPLIES: Record<
  Exclude<ChatFailure, "not-configured">,
  string
> = {
  busy: "I'm getting a lot of questions right now. Please try again in a moment.",
  "too-fast":
    "You're asking faster than I can keep up. Wait a minute, then try again.",
  failed:
    "Something went wrong on our side. Please try again, or browse Documents, Courses and the Library directly.",
};

/**
 * A live reply in the shape the conversation renders. The [n] citation
 * markers are for matching sources, not for reading, so they come out of the
 * text; the cited products appear as links underneath instead, priced the
 * way every other page on the site prices them — GST included.
 */
function fromReply(reply: ChatReply): DemoAnswer {
  const paragraphs = reply.answer
    .replace(/\s?\[\d{1,2}\]/g, "")
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
  return {
    paragraphs,
    links: reply.sources.map((source) => ({
      href: source.href,
      label: `${source.title} · ${formatPaise(grossPaise(source.priceInPaise))}`,
    })),
  };
}

/** The conversation as the API wants it: plain text, oldest first. */
const toTurns = (messages: Message[], question: string): ChatTurn[] => [
  ...messages.map((m) =>
    m.role === "you"
      ? { role: "user" as const, content: m.text! }
      : {
          role: "assistant" as const,
          content: m.answer!.paragraphs.join("\n\n"),
        },
  ),
  { role: "user", content: question },
];

/**
 * The assistant, as a preview.
 *
 * Every reply is scripted (see lib/demoScript). The point of building the
 * interface first is to settle how the conversation should feel — starters,
 * pacing, how sources are shown — before Milestone 4 puts retrieval behind
 * it. The scripted layer then gets replaced, not redesigned.
 *
 * The preview labelling is not decoration and should survive future edits:
 * this sits on a site that sells legal documents, and a visitor who mistakes
 * scripted text for advice is the failure mode worth designing against.
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
  const [thinking, setThinking] = useState(false);
  const [mode, setMode] = useState<Mode>("live");
  const nextId = useRef(0);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  // Keep the newest message in view, but never fight someone who has scrolled
  // up to re-read — only stick to the bottom when already near it.
  useEffect(() => {
    const log = logRef.current;
    if (!log) return;
    const nearBottom =
      log.scrollHeight - log.scrollTop - log.clientHeight < 160;
    if (nearBottom || thinking) {
      log.scrollTo({ top: log.scrollHeight, behavior: "smooth" });
    }
  }, [messages, thinking]);

  const reply = (answer: DemoAnswer) => {
    setMessages((m) => [
      ...m,
      { id: nextId.current++, role: "assistant", answer },
    ]);
    setThinking(false);
    inputRef.current?.focus();
  };

  const scripted = (question: string, id?: string) =>
    // The pause is honest staging, not a fake network call: a reply that
    // lands the same frame as the question reads as a lookup, which is what
    // this is, and makes the turn-taking hard to follow.
    window.setTimeout(
      () => reply(id ? answerById(id) : answerFor(question)),
      THINKING_MS,
    );

  const send = (text: string, id?: string) => {
    const question = text.trim().slice(0, CHAT_LIMITS.maxTurnLength);
    if (!question || thinking) return;

    const turns = toTurns(messages, question);
    setMessages((m) => [
      ...m,
      { id: nextId.current++, role: "you", text: question },
    ]);
    setDraft("");
    setThinking(true);

    if (mode === "preview") {
      scripted(question, id);
      return;
    }

    assistantApi
      .ask(turns)
      .then((result) => reply(fromReply(result)))
      .catch((error: unknown) => {
        const reason = error instanceof ChatError ? error.reason : "failed";
        if (reason === "not-configured") {
          setMode("preview");
          scripted(question, id);
          return;
        }
        reply({ paragraphs: [FAILURE_REPLIES[reason]] });
      });
  };

  const started = messages.length > 0;

  return (
    <div className={`flex flex-col overflow-hidden bg-surface ${className}`}>
      {/* Preview banner — persistent on purpose. */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-brand-border bg-brand-subtle px-4 py-2.5">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gold-ink">
          <Icon icon={Sparkles} size="xs" />{" "}
          {mode === "preview" ? "Preview" : "AI assistant"}
        </span>
        <p className="text-xs text-ink-muted">
          {mode === "preview"
            ? "Scripted answers, not a live assistant. It points at our material and doesn't give legal advice."
            : "Answers come from our catalogue and can be wrong. It doesn't give legal advice."}
        </p>
        {started && (
          <button
            type="button"
            onClick={() => setMessages([])}
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
        {!started && <Welcome onPick={send} />}

        {messages.map((message) =>
          message.role === "you" ? (
            <p key={message.id} className="flex justify-end">
              <span className="max-w-[85%] rounded-card rounded-br-sm bg-primary px-4 py-2.5 text-sm leading-relaxed text-ink-inverse">
                {message.text}
              </span>
            </p>
          ) : (
            <Reply key={message.id} answer={message.answer!} />
          ),
        )}

        {thinking && <Thinking />}
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
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              // Enter sends, Shift+Enter breaks the line — the convention
              // people already have from every other chat box.
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(draft);
              }
            }}
            placeholder="Ask about a document, a course, or how something works…"
            maxLength={CHAT_LIMITS.maxTurnLength}
            className="max-h-32 min-h-[2.25rem] flex-1 resize-none bg-transparent px-2 py-1.5 text-base text-ink placeholder:text-ink-subtle focus:outline-none"
          />
          <Button
            type="submit"
            size="sm"
            disabled={!draft.trim() || thinking}
            className="!px-2.5 !py-2"
          >
            <Icon icon={ArrowUp} />
            <span className="sr-only">Send</span>
          </Button>
        </div>
      </form>
    </div>
  );
}

function Welcome({ onPick }: { onPick: (text: string, id: string) => void }) {
  return (
    <div>
      <h2 className="text-lg">What can I help you find?</h2>
      <p className="mt-1 max-w-prose text-sm leading-relaxed text-ink-muted">
        Pick one of these to see how it answers, or type your own question.
      </p>
      <ul className="mt-5 grid gap-2 sm:grid-cols-2">
        {STARTER_QUESTIONS.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => onPick(s.question, s.id)}
              className="h-full w-full rounded-card border border-line bg-canvas px-4 py-3 text-left text-sm leading-relaxed text-ink transition-colors hover:border-brand-border hover:bg-brand-subtle"
            >
              {s.question}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Reply({ answer }: { answer: DemoAnswer }) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-subtle text-gold-ink">
        <Icon icon={Sparkles} size="xs" />
      </span>
      <div className="min-w-0 flex-1 space-y-3">
        {answer.paragraphs.map((p, i) => (
          <p key={i} className="max-w-prose text-sm leading-relaxed text-ink">
            {p}
          </p>
        ))}
        {answer.links && answer.links.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {answer.links.map((link) => (
              <Link
                key={link.href + link.label}
                href={link.href}
                className="rounded-control border border-line-strong bg-surface px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:border-brand-border hover:bg-brand-subtle"
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Thinking() {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-subtle text-gold-ink">
        <Icon icon={Sparkles} size="xs" />
      </span>
      {/* aria-hidden: the log already announces the reply when it lands, and
          announcing "thinking" first would just talk over it. */}
      <span aria-hidden className="flex items-center gap-1 py-2">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink-subtle motion-reduce:animate-none"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </span>
    </div>
  );
}
