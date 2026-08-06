"use client";

import type { OutlineModule } from "@pratikar/types";
import { Alert, Button, ButtonLink, Loading } from "@pratikar/ui";
import Link from "next/link";
import { useEffect, useState } from "react";

import { lmsApi } from "../api/lmsApi";
import { useCourseOutline } from "../hooks/useCourseOutline";

import { LessonSidebar } from "./LessonSidebar";

/**
 * The classroom: one lesson at a time, with the syllabus alongside it.
 *
 * Every lock drawn here is mirrored by a check on the endpoint behind it —
 * the padlocks are a courtesy to the learner, not the enforcement. Selecting
 * a locked lesson is impossible in the UI and refused by the API either way.
 */
export function LessonPlayer({ enrollmentId }: { enrollmentId: string }) {
  const { outline, isLoading, error, reload } = useCourseOutline(enrollmentId);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Open on the first thing still to do, so returning to a half-finished
  // course lands where the learner left off rather than back at lesson one.
  useEffect(() => {
    if (!outline || activeId) return;
    const next =
      outline.modules.find((m) => m.unlocked && !m.videoCompleted) ??
      outline.modules.find((m) => m.unlocked && m.quiz?.attemptCount === 0) ??
      outline.modules.find((m) => m.unlocked) ??
      outline.modules[0];
    if (next) setActiveId(next.id);
  }, [outline, activeId]);

  if (isLoading) return <Loading label="Loading your course…" />;
  if (error || !outline) {
    return (
      <Alert tone="danger" role="alert">
        {error ?? "Couldn't load this course."}
      </Alert>
    );
  }

  const active =
    outline.modules.find((m) => m.id === activeId) ?? outline.modules[0];

  const markWatched = async (moduleId: string) => {
    setBusy(true);
    setActionError(null);
    try {
      await lmsApi.completeModule(enrollmentId, moduleId);
      await reload();
    } catch {
      setActionError("Couldn't record that. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
      <div className="space-y-6">
        {!outline.hasVideoAccess && (
          <Alert tone="warning">
            Your viewing window closed on{" "}
            {new Date(outline.expiresAt).toLocaleDateString("en-IN")}. Lessons
            are no longer playable, and any certificate you earned stays valid.
          </Alert>
        )}

        {active ? (
          <LessonStage
            module={active}
            index={outline.modules.findIndex((m) => m.id === active.id)}
            enrollmentId={enrollmentId}
            canWatch={outline.hasVideoAccess}
            busy={busy}
            onMarkWatched={() => void markWatched(active.id)}
          />
        ) : (
          <Alert tone="info">This course has no lessons yet.</Alert>
        )}

        {actionError && (
          <Alert tone="danger" role="alert">
            {actionError}
          </Alert>
        )}
      </div>

      <LessonSidebar
        outline={outline}
        activeId={active?.id ?? null}
        onSelect={setActiveId}
      />
    </div>
  );
}

/** The lesson itself: video, then the test that gates what comes next. */
function LessonStage({
  module: lesson,
  index,
  enrollmentId,
  canWatch,
  busy,
  onMarkWatched,
}: {
  module: OutlineModule;
  index: number;
  enrollmentId: string;
  canWatch: boolean;
  busy: boolean;
  onMarkWatched: () => void;
}) {
  return (
    <article>
      <div className="overflow-hidden rounded-card border border-line bg-surface shadow-card">
        {/*
          Cloudflare Stream isn't provisioned, so there is no player to embed
          (docs/implementation-plan.md Milestone 1, item 1). A dead <video>
          element would be worse than saying so: the enrolment is real and the
          learner should know what they have and what they don't.
        */}
        <div className="relative aspect-video bg-surface-inverse-deep">
          <div className="absolute inset-0 grid place-items-center px-6 text-center">
            <div>
              <span
                aria-hidden
                className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-brand/40 bg-brand/10 text-2xl text-brand"
              >
                ▶
              </span>
              <p className="mt-4 text-sm font-medium text-ink-inverse">
                {canWatch
                  ? "Video hosting isn't connected yet"
                  : "Your viewing window has closed"}
              </p>
              <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-ink-inverse-muted">
                {canWatch
                  ? "This lesson will play here once Cloudflare Stream is switched on. Everything else in the course works today."
                  : "Lessons are no longer playable, but your progress and certificate are kept."}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-ink">
            Lesson {index + 1}
          </p>
          <h1 className="mt-1 text-2xl">{lesson.title}</h1>

          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-line pt-5">
            {lesson.videoCompleted ? (
              <span className="inline-flex items-center gap-2 text-sm font-medium text-success-text">
                <span aria-hidden>✓</span> Lesson completed
              </span>
            ) : (
              <>
                {/*
                  PROVISIONAL. This belongs to Stream's playback events, not to
                  a button — self-certifying that you watched something is
                  exactly the failure docs/TECH_DEBT.md warns about. It exists
                  because without it nobody can reach a test at all, and it
                  comes out the day Stream lands.
                */}
                <Button
                  type="button"
                  onClick={onMarkWatched}
                  disabled={busy || !canWatch}
                >
                  {busy ? "Saving…" : "Mark lesson as watched"}
                </Button>
                <span className="text-xs text-ink-subtle">
                  Becomes automatic once video hosting is connected.
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {lesson.quiz && (
        <div className="mt-6 rounded-card border border-line bg-surface p-6 shadow-card">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg">{lesson.quiz.title ?? "Lesson test"}</h2>
              <p className="mt-1 text-sm text-ink-muted">
                {lesson.quiz.questionCount}{" "}
                {lesson.quiz.questionCount === 1 ? "question" : "questions"} ·{" "}
                {Math.round(lesson.quiz.timeLimitSeconds / 60)} minute limit
              </p>
            </div>

            {lesson.quiz.bestScorePercent !== null && (
              <div className="text-right">
                <p className="text-2xl font-semibold text-ink">
                  {lesson.quiz.bestScorePercent}%
                </p>
                <p className="text-xs text-ink-subtle">
                  best of {lesson.quiz.attemptCount}{" "}
                  {lesson.quiz.attemptCount === 1 ? "attempt" : "attempts"}
                </p>
              </div>
            )}
          </div>

          <div className="mt-5 border-t border-line pt-5">
            {lesson.quiz.unlocked ? (
              <div className="flex flex-wrap items-center gap-3">
                <ButtonLink
                  href={`/learn/${enrollmentId}/test/${lesson.quiz.id}`}
                >
                  {lesson.quiz.attemptCount > 0
                    ? "Retake the test"
                    : "Start the test"}
                </ButtonLink>
                <span className="text-xs text-ink-subtle">
                  Retakes are unlimited — your best score counts.
                </span>
              </div>
            ) : (
              <p className="flex items-center gap-2 text-sm text-ink-muted">
                <span aria-hidden>🔒</span>
                Finish the lesson above to unlock this test.
              </p>
            )}
          </div>
        </div>
      )}

      {!lesson.quiz && lesson.videoCompleted && (
        <p className="mt-6 text-sm text-ink-muted">
          This lesson has no test.{" "}
          <Link
            href={`/learn/${enrollmentId}`}
            className="font-semibold text-primary hover:text-primary-hover"
          >
            Pick the next lesson
          </Link>{" "}
          from the list.
        </p>
      )}
    </article>
  );
}
