"use client";

import type { QuizAttemptResult } from "@pratikar/types";
import { Badge, ButtonLink } from "@pratikar/ui";

/**
 * The result screen, including which answer was right.
 *
 * Showing the answer key here is safe and deliberate: the attempt is
 * submitted and scored by this point, so nothing is given away, and being
 * told what you got wrong is the only part of a test that teaches anything.
 */
export function QuizResult({
  result,
  enrollmentId,
}: {
  result: QuizAttemptResult;
  enrollmentId: string;
}) {
  const passed = result.scorePercent >= result.passMark;
  const correctCount = result.questions.filter((question) => {
    const chosen = result.answers.find(
      (a) => a.questionId === question.id,
    )?.selectedOptionId;
    return question.options.some((o) => o.id === chosen && o.isCorrect);
  }).length;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="overflow-hidden rounded-card border border-line bg-surface shadow-card">
        <div
          className={`px-6 py-8 text-center ${passed ? "bg-hero-navy" : "bg-surface-inverse-deep"}`}
        >
          {/* Score ring: the number is the headline, so it gets the room. */}
          <div
            aria-hidden
            className={`mx-auto grid h-28 w-28 place-items-center rounded-full border-4 ${
              passed ? "border-brand" : "border-ink-inverse-muted/40"
            }`}
          >
            <span className="text-3xl font-bold text-ink-inverse">
              {result.scorePercent}%
            </span>
          </div>

          <p className="mt-5 text-lg font-semibold text-ink-inverse">
            {passed ? "Well done" : "Not quite yet"}
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-inverse-muted">
            {correctCount} of {result.questions.length} correct.{" "}
            {passed
              ? `That's above the ${result.passMark}% needed overall for your certificate.`
              : `You need ${result.passMark}% across all tests to earn the certificate — retake this one whenever you like, your best score counts.`}
          </p>
        </div>

        <div className="flex flex-wrap gap-3 border-t border-line p-6">
          <ButtonLink href={`/learn/${enrollmentId}`}>
            Back to the course
          </ButtonLink>
          <ButtonLink
            href={`/learn/${enrollmentId}/test/${result.quizId}`}
            variant="secondary"
          >
            Retake this test
          </ButtonLink>
        </div>
      </div>

      <section>
        <h2 className="text-lg">Review your answers</h2>
        <ol className="mt-4 space-y-4">
          {result.questions.map((question, index) => {
            const chosen = result.answers.find(
              (a) => a.questionId === question.id,
            )?.selectedOptionId;
            const correctOption = question.options.find((o) => o.isCorrect);
            const gotIt = Boolean(chosen && chosen === correctOption?.id);

            return (
              <li
                key={question.id}
                className="rounded-card border border-line bg-surface p-5 shadow-card"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <p className="text-sm font-medium text-ink">
                    {index + 1}. {question.prompt}
                  </p>
                  <Badge tone={gotIt ? "success" : "danger"}>
                    {gotIt ? "Correct" : chosen ? "Incorrect" : "Not answered"}
                  </Badge>
                </div>

                <ul className="mt-4 space-y-2">
                  {question.options.map((option) => {
                    const isChosen = option.id === chosen;
                    return (
                      <li
                        key={option.id}
                        className={`flex items-start gap-2 rounded-control border px-3 py-2 text-sm ${
                          option.isCorrect
                            ? "border-success-border bg-success-subtle text-success-text"
                            : isChosen
                              ? "border-danger-border bg-danger-subtle text-danger-text"
                              : "border-line text-ink-muted"
                        }`}
                      >
                        <span aria-hidden>
                          {option.isCorrect ? "✓" : isChosen ? "✕" : "·"}
                        </span>
                        <span>{option.text}</span>
                        {isChosen && (
                          <span className="ml-auto shrink-0 text-xs font-medium">
                            your answer
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
