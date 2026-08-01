"use client";

import type { QuizAttempt, QuizAttemptResult } from "@pratikar/types";
import { useCallback, useEffect, useRef, useState } from "react";

import { lmsApi } from "../api/lmsApi";

export type QuizPhase = "loading" | "taking" | "submitting" | "done" | "error";

/**
 * Drives one sitting of a quiz.
 *
 * Answers are saved to the server as they're chosen rather than posted in a
 * batch at the end. That costs a request per click and buys the thing that
 * matters: a timer running out, a closed tab, or a dropped connection loses
 * the unanswered questions and nothing else.
 *
 * The countdown reads the server's `expiresAt` rather than counting down from
 * a duration, so it stays honest across a sleeping laptop or a clock change.
 * It's a courtesy either way — the server refuses late answers regardless.
 */
export function useQuizAttempt(quizId: string, enrollmentId: string) {
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [result, setResult] = useState<QuizAttemptResult | null>(null);
  const [phase, setPhase] = useState<QuizPhase>("loading");
  const [error, setError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [savingCount, setSavingCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    lmsApi
      .startAttempt(quizId, enrollmentId)
      .then((started) => {
        if (cancelled) return;
        setAttempt(started);
        // Resuming: an attempt already under way comes back with whatever was
        // answered before the page was reloaded.
        setSelections(
          Object.fromEntries(
            started.answers
              .filter((a) => a.selectedOptionId)
              .map((a) => [a.questionId, a.selectedOptionId as string]),
          ),
        );
        setPhase("taking");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "";
        setError(
          message.includes("MODULE_NOT_COMPLETED")
            ? "Finish the lesson video before taking this test."
            : message.includes("ACCESS_EXPIRED")
              ? "Your access to this course has ended."
              : "Couldn't start this test. Please try again.",
        );
        setPhase("error");
      });

    return () => {
      cancelled = true;
    };
  }, [quizId, enrollmentId]);

  const submit = useCallback(async () => {
    if (!attempt) return;
    setPhase("submitting");
    try {
      setResult(await lmsApi.submitAttempt(attempt.id));
      setPhase("done");
    } catch {
      setError("Couldn't submit your answers. Please try again.");
      setPhase("taking");
    }
  }, [attempt]);

  // A ref so the countdown's auto-submit always calls the current closure
  // without the interval being torn down and restarted every render.
  const submitRef = useRef(submit);
  submitRef.current = submit;

  useEffect(() => {
    if (!attempt || phase !== "taking") return;

    const deadline = new Date(attempt.expiresAt).getTime();
    const tick = () => {
      const remaining = Math.max(0, Math.round((deadline - Date.now()) / 1000));
      setSecondsLeft(remaining);
      // Auto-submit on zero. The alternative — leaving the attempt open and
      // silently refusing every further answer — looks like a broken page.
      if (remaining === 0) void submitRef.current();
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [attempt, phase]);

  const choose = useCallback(
    (questionId: string, optionId: string) => {
      if (!attempt) return;
      setSelections((prev) => ({ ...prev, [questionId]: optionId }));
      setSavingCount((n) => n + 1);

      lmsApi
        .saveAnswer(attempt.id, questionId, optionId)
        .catch(() => {
          // Rolling the choice back would be worse: the learner would see
          // their answer vanish. Flag it instead so they know to re-pick.
          setError(
            "One of your answers didn't save. Check your connection and select it again.",
          );
        })
        .finally(() => setSavingCount((n) => n - 1));
    },
    [attempt],
  );

  const answeredCount = attempt
    ? attempt.questions.filter((q) => selections[q.id]).length
    : 0;

  return {
    attempt,
    result,
    phase,
    error,
    secondsLeft,
    selections,
    answeredCount,
    isSaving: savingCount > 0,
    choose,
    submit,
  };
}
