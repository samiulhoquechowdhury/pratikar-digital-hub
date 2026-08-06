"use client";

import type { CourseOutline } from "@pratikar/types";
import Link from "next/link";

/**
 * The syllabus rail: where you are, what's behind you, what's still locked.
 *
 * Progress is stated as a fraction and a bar rather than a bare percentage —
 * "3 of 8 lessons" tells a learner how much is left in a way "37%" doesn't.
 */
export function LessonSidebar({
  outline,
  activeId,
  onSelect,
}: {
  outline: CourseOutline;
  activeId: string | null;
  onSelect: (moduleId: string) => void;
}) {
  const total = outline.modules.length;
  const done = outline.modules.filter(
    (m) => m.videoCompleted && (!m.quiz || m.quiz.attemptCount > 0),
  ).length;

  const meetsPassMark =
    outline.aggregateScorePercent !== null &&
    outline.aggregateScorePercent >= outline.passMark;

  return (
    <aside className="lg:sticky lg:top-24 space-y-4">
      <div className="rounded-card border border-line bg-surface p-5 shadow-card">
        <h2 className="text-base">Your progress</h2>
        <p className="mt-1 text-sm text-ink-muted">
          {done} of {total} {total === 1 ? "lesson" : "lessons"} complete
        </p>
        <div
          aria-hidden
          className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-sunken"
        >
          <div
            className="h-full rounded-full bg-brand transition-[width] duration-500"
            style={{ width: `${total ? (done / total) * 100 : 0}%` }}
          />
        </div>

        {outline.aggregateScorePercent !== null && (
          <div className="mt-4 border-t border-line pt-4">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-ink-muted">Test average</span>
              <span
                className={`text-lg font-semibold ${
                  meetsPassMark ? "text-success-text" : "text-ink"
                }`}
              >
                {outline.aggregateScorePercent}%
              </span>
            </div>
            <p className="mt-1 text-xs text-ink-subtle">
              {meetsPassMark
                ? `Above the ${outline.passMark}% needed for your certificate.`
                : `You need ${outline.passMark}% overall. Retake your weakest tests to lift this.`}
            </p>
          </div>
        )}

        {outline.certificate && (
          <Link
            href={`/learn/${outline.enrollmentId}/certificate`}
            className="mt-4 flex items-center gap-2 rounded-control border border-brand-border bg-brand-subtle px-3 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-brand hover:text-on-brand"
          >
            <span aria-hidden>🏅</span> View your certificate
          </Link>
        )}
      </div>

      <nav
        aria-label="Lessons"
        className="overflow-hidden rounded-card border border-line bg-surface shadow-card"
      >
        <ol className="divide-y divide-line">
          {outline.modules.map((lesson, index) => {
            const isActive = lesson.id === activeId;
            const finished =
              lesson.videoCompleted &&
              (!lesson.quiz || lesson.quiz.attemptCount > 0);

            return (
              <li key={lesson.id}>
                <button
                  type="button"
                  disabled={!lesson.unlocked}
                  onClick={() => onSelect(lesson.id)}
                  aria-current={isActive ? "step" : undefined}
                  className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors ${
                    isActive
                      ? "bg-primary-subtle"
                      : lesson.unlocked
                        ? "hover:bg-surface-sunken"
                        : "cursor-not-allowed opacity-60"
                  }`}
                >
                  <span
                    aria-hidden
                    className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-semibold ${
                      finished
                        ? "bg-success-subtle text-success-text"
                        : lesson.unlocked
                          ? "bg-surface-sunken text-ink-muted"
                          : "bg-surface-sunken text-ink-subtle"
                    }`}
                  >
                    {finished ? "✓" : lesson.unlocked ? index + 1 : "🔒"}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-ink">
                      {lesson.title}
                    </span>

                    {lesson.quiz && (
                      <span className="mt-1 flex items-center gap-1.5 text-xs text-ink-subtle">
                        {lesson.quiz.bestScorePercent !== null ? (
                          <>
                            <span aria-hidden>✓</span> Test{" "}
                            {lesson.quiz.bestScorePercent}%
                          </>
                        ) : lesson.quiz.unlocked ? (
                          <>
                            <span aria-hidden>●</span> Test ready
                          </>
                        ) : (
                          <>
                            <span aria-hidden>🔒</span> Test locked
                          </>
                        )}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>
    </aside>
  );
}
