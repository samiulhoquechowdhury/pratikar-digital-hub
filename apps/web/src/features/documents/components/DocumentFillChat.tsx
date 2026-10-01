"use client";

import type { Template, TemplateField } from "@pratikar/types";
import { Alert, Button } from "@pratikar/ui";
import {
  AlertTriangle,
  ArrowUp,
  CheckCircle2,
  Circle,
  Sparkles,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { classifyChatError, type ChatFailure } from "@/features/assistant";
import { Icon } from "@/shared/components/Icon";

import {
  documentFillApi,
  FILL_LIMITS,
  type FillReply,
  type FillTurn,
} from "../api/documentFillApi";

import type { FilledData } from "./DynamicTemplateForm";

const FAILURES: Record<Exclude<ChatFailure, "not-configured">, string> = {
  busy: "I'm getting a lot of requests right now. Please try again in a moment.",
  "too-fast": "That was quick — wait a minute, then try again.",
  failed:
    "Something went wrong on our side. Please try again, or use the form.",
};

/** How an answer reads back to the customer — the option's label, a real date. */
function display(field: TemplateField, value: string | number | undefined) {
  if (value === undefined || value === "") return null;
  if (field.type === "select") {
    return (
      field.options?.find((o) => o.value === value)?.label ?? String(value)
    );
  }
  if (field.type === "date" && typeof value === "string") {
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime())
      ? value
      : date.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
  }
  if (typeof value === "number") return value.toLocaleString("en-IN");
  return value;
}

/**
 * Filling a template by conversation instead of the form.
 *
 * It never generates anything. It collects answers, shows them as they're
 * recorded, and hands them to the ordinary form — where the customer checks
 * each one and generates as usual. Seeing every answer beside the chat is
 * the point: a misheard name should be caught while the conversation is
 * still on screen, not in a signed document.
 */
export function DocumentFillChat({
  template,
  onReview,
  onUnavailable,
}: {
  template: Template;
  /** Called with the answers when the customer is ready to check them. */
  onReview: (answers: FilledData) => void;
  /** Called when the server has no model configured; the form is the way. */
  onUnavailable: () => void;
}) {
  const [turns, setTurns] = useState<FillTurn[]>([]);
  const [state, setState] = useState<Omit<FillReply, "reply"> | null>(null);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logRef.current?.scrollTo({
      top: logRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [turns, thinking]);

  const answers = state?.answers ?? {};
  const unclear = new Set(state?.unclear.map((u) => u.key));

  const send = () => {
    const text = draft.trim().slice(0, FILL_LIMITS.maxTurnLength);
    if (!text || thinking) return;
    const next: FillTurn[] = [...turns, { role: "user", content: text }];
    setTurns(next);
    setDraft("");
    setThinking(true);

    documentFillApi
      .turn(template.id, next, answers)
      .then((result) => {
        const { reply, ...rest } = result;
        setState(rest);
        setTurns((t) => [...t, { role: "assistant", content: reply }]);
      })
      .catch((error: unknown) => {
        const reason = classifyChatError(error);
        if (reason === "not-configured") {
          onUnavailable();
          return;
        }
        setTurns((t) => [
          ...t,
          { role: "assistant", content: FAILURES[reason] },
        ]);
      })
      .finally(() => setThinking(false));
  };

  const answeredCount = template.fieldSchema.filter(
    (f) => display(f, answers[f.key]) !== null,
  ).length;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="flex h-[min(70vh,36rem)] flex-col overflow-hidden rounded-card border border-line bg-surface">
        <p className="flex items-center gap-2 border-b border-line bg-primary-subtle/50 px-4 py-2.5 text-xs text-ink-muted">
          <Icon icon={Sparkles} size="xs" className="text-primary" />
          AI can mishear. Every answer is shown on the right, and you&apos;ll
          check them all in the form before anything is generated.
        </p>

        <div
          ref={logRef}
          role="log"
          aria-live="polite"
          aria-label="Conversation"
          className="flex-1 space-y-4 overflow-y-auto px-4 py-5"
        >
          <p className="max-w-prose text-sm leading-relaxed text-ink">
            Tell me about your {template.title.toLowerCase()} in your own words
            — who it&apos;s between, amounts, dates. I&apos;ll ask for anything
            I still need.
          </p>
          {turns.map((turn, index) =>
            turn.role === "user" ? (
              <p key={index} className="flex justify-end">
                <span className="max-w-[85%] rounded-card rounded-br-sm bg-primary px-4 py-2.5 text-sm leading-relaxed text-ink-inverse">
                  {turn.content}
                </span>
              </p>
            ) : (
              <p
                key={index}
                className="max-w-prose text-sm leading-relaxed text-ink"
              >
                {turn.content}
              </p>
            ),
          )}
          {thinking && (
            <p aria-hidden className="flex gap-1 py-2">
              {[0, 150, 300].map((delay) => (
                <span
                  key={delay}
                  className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink-subtle motion-reduce:animate-none"
                  style={{ animationDelay: `${delay}ms` }}
                />
              ))}
            </p>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="flex items-end gap-2 border-t border-line p-3"
        >
          <label htmlFor="fill-input" className="sr-only">
            Your answer
          </label>
          <textarea
            id="fill-input"
            rows={1}
            value={draft}
            maxLength={FILL_LIMITS.maxTurnLength}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Type your answer…"
            className="max-h-32 min-h-[2.5rem] flex-1 resize-none rounded-control border border-line-strong px-3 py-2 text-base text-ink placeholder:text-ink-subtle"
          />
          <Button
            type="submit"
            disabled={!draft.trim() || thinking}
            className="!px-3"
          >
            <Icon icon={ArrowUp} />
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </div>

      <aside className="rounded-card border border-line bg-surface p-5 lg:self-start">
        <h3 className="text-base font-semibold">Your answers</h3>
        <p className="mt-1 text-sm text-ink-muted">
          {answeredCount} of {template.fieldSchema.length} recorded
        </p>
        <ul className="mt-4 space-y-3">
          {template.fieldSchema.map((field) => {
            const shown = display(field, answers[field.key]);
            const isUnclear = unclear.has(field.key);
            return (
              <li key={field.key} className="flex gap-2.5 text-sm">
                <Icon
                  icon={
                    isUnclear ? AlertTriangle : shown ? CheckCircle2 : Circle
                  }
                  className={`mt-0.5 ${
                    isUnclear
                      ? "text-warning-text"
                      : shown
                        ? "text-success-text"
                        : "text-ink-subtle"
                  }`}
                />
                <span className="min-w-0">
                  <span className="block text-ink-muted">
                    {field.label}
                    {field.required && !shown && (
                      <span className="text-ink-subtle"> · required</span>
                    )}
                  </span>
                  <span className="block break-words font-medium text-ink">
                    {isUnclear ? "Unclear — please restate" : (shown ?? "—")}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>

        {state?.complete && (
          <div className="mt-5">
            <Alert tone="success" role="status">
              Everything required is answered.
            </Alert>
          </div>
        )}

        <Button
          variant={state?.complete ? "primary" : "secondary"}
          className="mt-5 w-full"
          onClick={() => onReview(answers)}
          disabled={answeredCount === 0}
        >
          Review in the form
        </Button>
        <p className="mt-2 text-xs text-ink-subtle">
          You can stop at any point and finish in the form.
        </p>
      </aside>
    </div>
  );
}
