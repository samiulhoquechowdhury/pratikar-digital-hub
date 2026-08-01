"use client";

import type { QuizQuestionDraft } from "@pratikar/types";
import {
  Alert,
  Button,
  Card,
  Field,
  Input,
  Loading,
  Textarea,
} from "@pratikar/ui";
import Link from "next/link";
import { useEffect, useState } from "react";

import { FormActions, FormSection } from "@/shared/components/FormLayout";

import { quizApi } from "../api/quizApi";
import {
  addOption,
  addQuestion,
  emptyQuestion,
  moveQuestion,
  removeOption,
  removeQuestion,
  setCorrectOption,
  updateQuestion,
  validateQuiz,
  type QuizProblem,
} from "../lib/quizDraft";

const ICON_BUTTON =
  "rounded-control border border-line-strong bg-surface px-2 py-1 text-xs text-ink-muted hover:bg-surface-sunken disabled:opacity-40";

/**
 * Authoring one module's test.
 *
 * A learner must sit this before the next lesson opens, and the aggregate
 * across every test decides whether a certificate is issued — so the two
 * rules that make a question scoreable (at least two options, exactly one
 * correct) are checked here and again on the API. A question that breaks
 * either one is coloured in place rather than reported in a list at the
 * bottom, because on a twenty-question test the list is useless.
 */
export function QuizEditor({
  courseId,
  moduleId,
  moduleTitle,
}: {
  courseId: string;
  moduleId: string;
  moduleTitle: string;
}) {
  const [title, setTitle] = useState("");
  const [minutes, setMinutes] = useState("10");
  const [questions, setQuestions] = useState<QuizQuestionDraft[]>([]);
  const [existed, setExisted] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [problems, setProblems] = useState<QuizProblem[]>([]);

  useEffect(() => {
    let cancelled = false;

    quizApi
      .get(moduleId)
      .then((quiz) => {
        if (cancelled) return;
        if (quiz) {
          setExisted(true);
          setTitle(quiz.title ?? "");
          setMinutes(String(Math.round(quiz.timeLimitSeconds / 60)));
          setQuestions(
            quiz.questions.map((q) => ({
              prompt: q.prompt,
              options: q.options.map((o) => ({
                text: o.text,
                isCorrect: o.isCorrect,
              })),
            })),
          );
        } else {
          // Start with one blank question rather than an empty screen — the
          // first thing anyone does here is add one.
          setQuestions([emptyQuestion()]);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load this test.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [moduleId]);

  const problemsFor = (index: number) =>
    problems.filter((p) => p.index === index);
  const wideProblems = problems.filter((p) => p.index === null);

  const save = async () => {
    setError(null);
    setSaved(false);

    const found = validateQuiz(questions);
    setProblems(found);
    if (found.length > 0) {
      setError("Fix the problems below before saving.");
      return;
    }

    const timeLimitSeconds = Math.round(Number(minutes) * 60);
    if (!Number.isFinite(timeLimitSeconds) || timeLimitSeconds < 30) {
      setError("The time limit must be at least half a minute.");
      return;
    }

    setIsSaving(true);
    try {
      await quizApi.save(moduleId, {
        title: title.trim() || undefined,
        timeLimitSeconds,
        questions,
      });
      setExisted(true);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save this test.");
    } finally {
      setIsSaving(false);
    }
  };

  const remove = async () => {
    if (
      !window.confirm(
        "Delete this test? Learners already past this lesson keep their recorded scores, but the next lesson will no longer be gated by a test.",
      )
    ) {
      return;
    }
    setIsSaving(true);
    try {
      await quizApi.remove(moduleId);
      setExisted(false);
      setQuestions([emptyQuestion()]);
      setSaved(false);
    } catch {
      setError("Couldn't delete this test.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <Loading label="Loading this test…" />;

  return (
    <div className="space-y-6">
      <FormSection
        title="Test settings"
        description="Learners must sit this test before the next lesson unlocks. Retakes are unlimited and the best score counts."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Title"
            htmlFor="quiz-title"
            hint="Optional. Defaults to “Lesson test”."
          >
            <Input
              id="quiz-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`${moduleTitle} — knowledge check`}
            />
          </Field>

          <Field
            label="Time limit (minutes)"
            htmlFor="quiz-minutes"
            hint="The clock starts when the learner opens the test and keeps running if they leave."
          >
            <Input
              id="quiz-minutes"
              inputMode="numeric"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
            />
          </Field>
        </div>
      </FormSection>

      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
          <div>
            <h2 className="text-base">Questions</h2>
            <p className="mt-1 max-w-prose text-sm text-ink-muted">
              Multiple choice, one correct answer each. Learners see the options
              in this order.
            </p>
          </div>
          <span className="text-sm text-ink-subtle">
            {questions.length}{" "}
            {questions.length === 1 ? "question" : "questions"}
          </span>
        </div>

        <ol className="mt-5 space-y-4">
          {questions.map((question, index) => {
            const questionProblems = problemsFor(index);
            const hasProblem = questionProblems.length > 0;

            return (
              <li
                key={index}
                className={`rounded-card border p-4 ${
                  hasProblem
                    ? "border-danger-border bg-danger-subtle"
                    : "border-line bg-canvas"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-ink-inverse"
                  >
                    {index + 1}
                  </span>

                  <div className="min-w-0 flex-1 space-y-4">
                    <Field label="Question" htmlFor={`q-prompt-${index}`}>
                      <Textarea
                        id={`q-prompt-${index}`}
                        rows={2}
                        value={question.prompt}
                        onChange={(e) =>
                          setQuestions(
                            updateQuestion(questions, index, {
                              prompt: e.target.value,
                            }),
                          )
                        }
                        placeholder="Which return does a freelancer file monthly?"
                      />
                    </Field>

                    <div>
                      <p className="text-sm font-medium text-ink">
                        Options{" "}
                        <span className="font-normal text-ink-subtle">
                          — select the correct one
                        </span>
                      </p>

                      <ul className="mt-2 space-y-2">
                        {question.options.map((option, optionIndex) => (
                          <li
                            key={optionIndex}
                            className="flex items-center gap-2"
                          >
                            {/* A radio, not a checkbox: single-choice is the
                                rule, and the control should say so before
                                validation has to. */}
                            <input
                              type="radio"
                              name={`correct-${index}`}
                              checked={option.isCorrect}
                              onChange={() =>
                                setQuestions(
                                  setCorrectOption(
                                    questions,
                                    index,
                                    optionIndex,
                                  ),
                                )
                              }
                              aria-label={`Option ${String.fromCharCode(
                                65 + optionIndex,
                              )} is correct`}
                              className="h-4 w-4 shrink-0 accent-navy-800"
                            />
                            <span
                              aria-hidden
                              className="w-4 shrink-0 text-xs font-semibold text-ink-subtle"
                            >
                              {String.fromCharCode(65 + optionIndex)}
                            </span>
                            <Input
                              value={option.text}
                              onChange={(e) =>
                                setQuestions(
                                  updateQuestion(questions, index, {
                                    options: question.options.map((o, i) =>
                                      i === optionIndex
                                        ? { ...o, text: e.target.value }
                                        : o,
                                    ),
                                  }),
                                )
                              }
                              placeholder={`Option ${String.fromCharCode(
                                65 + optionIndex,
                              )}`}
                              className="py-1.5 text-sm"
                            />
                            <button
                              type="button"
                              disabled={question.options.length <= 2}
                              onClick={() =>
                                setQuestions(
                                  removeOption(questions, index, optionIndex),
                                )
                              }
                              className="rounded-control border border-danger-border px-2 py-1.5 text-xs text-danger-text hover:bg-danger-subtle disabled:opacity-40"
                            >
                              <span className="sr-only">
                                Remove option {optionIndex + 1}
                              </span>
                              <span aria-hidden>×</span>
                            </button>
                          </li>
                        ))}
                      </ul>

                      <button
                        type="button"
                        disabled={question.options.length >= 6}
                        onClick={() =>
                          setQuestions(addOption(questions, index))
                        }
                        className="mt-2 text-sm font-semibold text-primary hover:text-primary-hover disabled:opacity-40"
                      >
                        Add option
                      </button>
                    </div>

                    {hasProblem && (
                      <ul role="alert" className="space-y-1">
                        {questionProblems.map((p, i) => (
                          <li key={i} className="text-sm text-danger-text">
                            {p.message}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-col gap-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() =>
                        setQuestions(moveQuestion(questions, index, index - 1))
                      }
                      className={ICON_BUTTON}
                    >
                      <span className="sr-only">Move up</span>
                      <span aria-hidden>↑</span>
                    </button>
                    <button
                      type="button"
                      disabled={index === questions.length - 1}
                      onClick={() =>
                        setQuestions(moveQuestion(questions, index, index + 1))
                      }
                      className={ICON_BUTTON}
                    >
                      <span className="sr-only">Move down</span>
                      <span aria-hidden>↓</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setQuestions(removeQuestion(questions, index))
                      }
                      className="rounded-control border border-danger-border px-2 py-1 text-xs text-danger-text hover:bg-danger-subtle"
                    >
                      <span className="sr-only">
                        Remove question {index + 1}
                      </span>
                      <span aria-hidden>×</span>
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        {wideProblems.length > 0 && (
          <ul role="alert" className="mt-4 space-y-1">
            {wideProblems.map((p, i) => (
              <li key={i} className="text-sm text-danger-text">
                {p.message}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setQuestions(addQuestion(questions))}
          >
            Add question
          </Button>
        </div>
      </Card>

      {saved && (
        <Alert tone="success" role="status">
          Test saved. Learners will see it after this lesson&apos;s video.
        </Alert>
      )}

      {error && (
        <Alert tone="danger" role="alert">
          {error}
        </Alert>
      )}

      <FormActions>
        <Button type="button" onClick={() => void save()} disabled={isSaving}>
          {isSaving ? "Saving…" : existed ? "Save changes" : "Create test"}
        </Button>
        <Link
          href={`/courses/${courseId}`}
          className="text-sm font-medium text-ink-muted hover:text-ink"
        >
          Back to the course
        </Link>
        {existed && (
          <button
            type="button"
            onClick={() => void remove()}
            disabled={isSaving}
            className="ml-auto text-sm font-medium text-danger-text hover:underline disabled:opacity-40"
          >
            Delete this test
          </button>
        )}
      </FormActions>
    </div>
  );
}
