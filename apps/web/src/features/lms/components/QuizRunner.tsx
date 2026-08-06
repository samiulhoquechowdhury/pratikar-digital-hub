"use client";

import { Alert, Button, ButtonLink, Loading } from "@pratikar/ui";
import Link from "next/link";
import { useState } from "react";

import { useQuizAttempt } from "../hooks/useQuizAttempt";

import { QuizResult } from "./QuizResult";

const formatClock = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

/**
 * One sitting of a test: one question at a time, a countdown, and a review
 * step before submitting.
 *
 * One question per screen rather than a long scroll — it's what keeps a timed
 * test from feeling like a wall of text, and it makes the "answered / not
 * answered" state legible at a glance in the pager underneath.
 */
export function QuizRunner({
  quizId,
  enrollmentId,
}: {
  quizId: string;
  enrollmentId: string;
}) {
  const {
    attempt,
    result,
    phase,
    error,
    secondsLeft,
    selections,
    answeredCount,
    isSaving,
    choose,
    submit,
  } = useQuizAttempt(quizId, enrollmentId);
  const [index, setIndex] = useState(0);
  const [confirming, setConfirming] = useState(false);

  if (phase === "loading") return <Loading label="Preparing your test…" />;

  if (phase === "error") {
    return (
      <div className="space-y-4">
        <Alert tone="danger" role="alert">
          {error ?? "Couldn't start this test."}
        </Alert>
        <ButtonLink href={`/learn/${enrollmentId}`} variant="secondary">
          Back to the course
        </ButtonLink>
      </div>
    );
  }

  if (phase === "done" && result) {
    return <QuizResult result={result} enrollmentId={enrollmentId} />;
  }

  if (!attempt) return null;

  const question = attempt.questions[index];
  const total = attempt.questions.length;
  // Under two minutes the countdown turns red. Chosen because it's roughly the
  // point where "finish properly" becomes "answer what's left".
  const urgent = secondsLeft !== null && secondsLeft <= 120;

  return (
    <div className="mx-auto max-w-3xl">
      {/* Sticky bar: the clock is the one thing that must never scroll away. */}
      <div className="sticky top-16 z-10 -mx-4 mb-6 border-b border-line bg-canvas/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-ink">
              {attempt.title ?? "Lesson test"}
            </p>
            <p className="text-xs text-ink-subtle">
              {answeredCount} of {total} answered
              {isSaving && " · saving…"}
            </p>
          </div>

          <div
            role="timer"
            aria-live="off"
            className={`rounded-control px-3 py-1.5 text-lg font-semibold tabular-nums ${
              urgent
                ? "bg-danger-subtle text-danger-text"
                : "bg-surface-sunken text-ink"
            }`}
          >
            {secondsLeft === null ? "—:—" : formatClock(secondsLeft)}
          </div>
        </div>

        <div
          aria-hidden
          className="mt-2 h-1 overflow-hidden rounded-full bg-surface-sunken"
        >
          <div
            className="h-full rounded-full bg-brand transition-[width] duration-300"
            style={{ width: `${total ? (answeredCount / total) * 100 : 0}%` }}
          />
        </div>
      </div>

      {error && (
        <div className="mb-4">
          <Alert tone="warning" role="alert">
            {error}
          </Alert>
        </div>
      )}

      {question && (
        <div className="rounded-card border border-line bg-surface p-6 shadow-card sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-ink">
            Question {index + 1} of {total}
          </p>
          <h1 className="mt-3 text-xl leading-relaxed">{question.prompt}</h1>

          <fieldset className="mt-6 space-y-3">
            <legend className="sr-only">{question.prompt}</legend>
            {question.options.map((option, optionIndex) => {
              const selected = selections[question.id] === option.id;
              return (
                <label
                  key={option.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-card border p-4 transition-colors ${
                    selected
                      ? "border-primary bg-primary-subtle"
                      : "border-line hover:bg-surface-sunken"
                  }`}
                >
                  <input
                    type="radio"
                    name={question.id}
                    value={option.id}
                    checked={selected}
                    onChange={() => choose(question.id, option.id)}
                    className="sr-only"
                  />
                  {/* Letter rather than a radio dot: it gives the option a
                      name someone can refer to, and reads better at size. */}
                  <span
                    aria-hidden
                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
                      selected
                        ? "bg-primary text-ink-inverse"
                        : "bg-surface-sunken text-ink-muted"
                    }`}
                  >
                    {String.fromCharCode(65 + optionIndex)}
                  </span>
                  <span className="text-base leading-relaxed text-ink">
                    {option.text}
                  </span>
                </label>
              );
            })}
          </fieldset>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <Button
          type="button"
          variant="secondary"
          disabled={index === 0}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
        >
          Previous
        </Button>

        {index < total - 1 ? (
          <Button type="button" onClick={() => setIndex((i) => i + 1)}>
            Next question
          </Button>
        ) : (
          <Button
            type="button"
            onClick={() => setConfirming(true)}
            disabled={phase === "submitting"}
          >
            {phase === "submitting" ? "Submitting…" : "Review and submit"}
          </Button>
        )}
      </div>

      {/* Question pager — the fastest way back to something skipped. */}
      <nav aria-label="Questions" className="mt-6">
        <ul className="flex flex-wrap gap-2">
          {attempt.questions.map((q, i) => {
            const answered = Boolean(selections[q.id]);
            return (
              <li key={q.id}>
                <button
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-current={i === index ? "true" : undefined}
                  className={`h-9 w-9 rounded-control text-sm font-medium transition-colors ${
                    i === index
                      ? "bg-primary text-ink-inverse"
                      : answered
                        ? "bg-success-subtle text-success-text"
                        : "border border-line-strong bg-surface text-ink-muted hover:bg-surface-sunken"
                  }`}
                >
                  {i + 1}
                  <span className="sr-only">
                    {answered ? " (answered)" : " (not answered)"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {confirming && (
        <div className="mt-6 rounded-card border border-brand-border bg-brand-subtle p-6">
          <h2 className="text-base">Submit your answers?</h2>
          <p className="mt-2 text-sm text-ink-muted">
            {answeredCount === total
              ? "All questions answered."
              : `${total - answeredCount} question${
                  total - answeredCount === 1 ? "" : "s"
                } still blank — blanks are marked wrong.`}{" "}
            You can retake this test as many times as you like; your best score
            is the one that counts.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              type="button"
              onClick={() => void submit()}
              disabled={phase === "submitting"}
            >
              {phase === "submitting" ? "Submitting…" : "Submit test"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setConfirming(false)}
            >
              Keep working
            </Button>
          </div>
        </div>
      )}

      <p className="mt-8 text-center text-xs text-ink-subtle">
        Your answers save as you pick them.{" "}
        <Link
          href={`/learn/${enrollmentId}`}
          className="font-medium text-primary hover:text-primary-hover"
        >
          Leave the test
        </Link>{" "}
        — the clock keeps running.
      </p>
    </div>
  );
}
