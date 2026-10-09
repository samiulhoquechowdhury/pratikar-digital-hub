"use client";

import { Alert, Badge, Card, EmptyState, SkeletonList } from "@pratikar/ui";
import { useEffect, useState } from "react";

import {
  insightsApi,
  type AssistantConversation,
  type AssistantInsights,
} from "../api/insightsApi";
import { share } from "../lib/share";

const PERIODS = [7, 30, 90] as const;

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

/**
 * What customers ask the assistant, and — the point of the page — what they
 * asked for that the catalogue doesn't have. Each unmatched question is a
 * document someone wanted; the list is the to-do list for new forms.
 */
export function AssistantInsightsView() {
  const [days, setDays] = useState<(typeof PERIODS)[number]>(30);
  const [data, setData] = useState<AssistantInsights | null>(null);
  const [conversations, setConversations] = useState<
    AssistantConversation[] | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(null);
    Promise.all([insightsApi.insights(days), insightsApi.conversations()])
      .then(([insights, recent]) => {
        if (cancelled) return;
        setData(insights);
        setConversations(recent);
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setError(
          cause instanceof Error && cause.message.includes("403")
            ? "Assistant insights are for content managers and admins."
            : "Couldn't load the assistant insights.",
        );
      });
    return () => {
      cancelled = true;
    };
  }, [days]);

  if (error) {
    return (
      <Alert tone="danger" role="alert">
        {error}
      </Alert>
    );
  }

  return (
    <div className="space-y-8">
      <div
        role="group"
        aria-label="Period"
        className="inline-flex rounded-control border border-line bg-surface p-1"
      >
        {PERIODS.map((period) => (
          <button
            key={period}
            type="button"
            aria-pressed={days === period}
            onClick={() => setDays(period)}
            className={`rounded-control px-3 py-1.5 text-sm font-medium transition-colors ${
              days === period
                ? "bg-primary text-ink-inverse"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            Last {period} days
          </button>
        ))}
      </div>

      {!data ? (
        <SkeletonList rows={4} label="Loading assistant insights…" />
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Questions asked" value={String(data.questions)} />
            <Stat label="Conversations" value={String(data.conversations)} />
            <Stat
              label="Nothing in the catalogue"
              value={String(data.unmatched)}
              note={`${share(data.unmatched, data.questions)} of questions`}
              attention={data.unmatched > 0}
            />
            <Stat
              label="Custom drafts offered"
              value={String(data.draftOffers)}
              note={`${share(data.signedIn, data.questions)} asked signed in`}
            />
          </dl>

          <section aria-labelledby="gaps-title">
            <h2 id="gaps-title" className="text-lg font-semibold">
              What customers looked for and didn&apos;t find
            </h2>
            <p className="mt-1 max-w-prose text-sm text-ink-muted">
              Questions where the assistant had nothing to recommend, or offered
              a custom draft instead. The ones that repeat are the forms worth
              adding to the library.
            </p>
            {data.gaps.length === 0 ? (
              <div className="mt-4">
                <EmptyState
                  title="No gaps in this period"
                  description="Every question found something in the catalogue."
                />
              </div>
            ) : (
              <ul className="mt-4 divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
                {data.gaps.map((gap) => (
                  <li
                    key={gap.id}
                    className="flex flex-wrap items-start justify-between gap-3 px-4 py-3"
                  >
                    <p className="min-w-0 flex-1 text-sm text-ink">
                      {gap.question}
                    </p>
                    <span className="flex shrink-0 items-center gap-2 text-xs text-ink-subtle">
                      {gap.suggestedDraft && (
                        <Badge tone="brand">Draft offered</Badge>
                      )}
                      {when(gap.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      <section aria-labelledby="recent-title">
        <h2 id="recent-title" className="text-lg font-semibold">
          Recent conversations
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          Kept for 90 days, then deleted. Shown without names.
        </p>
        {!conversations ? null : conversations.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="No conversations yet"
              description="They appear here once customers use the assistant."
            />
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {conversations.map((conversation) => (
              <li key={conversation.conversationId}>
                <Card className="p-0">
                  <details>
                    <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                      <span className="min-w-0 flex-1 truncate font-medium text-ink">
                        {conversation.turns[0]?.question ?? "—"}
                      </span>
                      <span className="flex items-center gap-2 text-xs text-ink-subtle">
                        <Badge tone="neutral">
                          {conversation.turns.length}{" "}
                          {conversation.turns.length === 1
                            ? "question"
                            : "questions"}
                        </Badge>
                        {conversation.signedIn && (
                          <Badge tone="neutral">Signed in</Badge>
                        )}
                        {conversation.startedAt && when(conversation.startedAt)}
                      </span>
                    </summary>
                    <ol className="space-y-4 border-t border-line px-4 py-4">
                      {conversation.turns.map((turn, index) => (
                        <li key={index} className="space-y-1.5 text-sm">
                          <p className="font-semibold text-ink">
                            {turn.question}
                          </p>
                          <p className="whitespace-pre-wrap text-ink-muted">
                            {turn.answer}
                          </p>
                          <p className="flex flex-wrap gap-2 text-xs">
                            {turn.cited.map((title) => (
                              <Badge key={title} tone="success">
                                {title}
                              </Badge>
                            ))}
                            {turn.suggestedDraft && (
                              <Badge tone="brand">Draft offered</Badge>
                            )}
                            {turn.refused && (
                              <Badge tone="warning">Declined</Badge>
                            )}
                            {turn.citedCount === 0 &&
                              !turn.suggestedDraft &&
                              !turn.refused && (
                                <Badge tone="danger">Nothing found</Badge>
                              )}
                          </p>
                        </li>
                      ))}
                    </ol>
                  </details>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  note,
  attention = false,
}: {
  label: string;
  value: string;
  note?: string;
  attention?: boolean;
}) {
  return (
    <div
      className={`rounded-card border bg-surface p-4 ${attention ? "border-warning-text/30" : "border-line"}`}
    >
      <dt className="text-sm text-ink-muted">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold tabular-nums text-ink">
        {value}
      </dd>
      {note && <dd className="mt-0.5 text-xs text-ink-subtle">{note}</dd>}
    </div>
  );
}
