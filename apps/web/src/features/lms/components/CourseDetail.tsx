"use client";

import {
  Alert,
  Badge,
  ButtonLink,
  Card,
  EmptyState,
  Loading,
} from "@pratikar/ui";
import Link from "next/link";

import { BuyButton } from "@/features/payments";
import { useAuth } from "@/shared/providers/AuthProvider";

import { useCourse } from "../hooks/useCourse";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

/**
 * The course landing page, in the shape a learning platform uses: what you get
 * on the left, what it costs on the right, and the syllabus visible before you
 * pay rather than after.
 *
 * Once enrolled, the right-hand column stops selling and starts reporting —
 * same position, different job, so the thing you look for doesn't move.
 */
export function CourseDetail({ courseId }: { courseId: string }) {
  const { user } = useAuth();
  const {
    course,
    enrollment,
    hasVideoAccess,
    isLoading,
    error,
    refreshEnrollment,
  } = useCourse(courseId, !!user);

  if (isLoading) return <Loading label="Loading course…" />;

  if (error) {
    return (
      <Alert tone="danger" role="alert">
        {error}
      </Alert>
    );
  }

  if (!course) {
    return (
      <EmptyState
        title="This course isn't available"
        description="It may have been unpublished, or the link may be wrong."
        action={<ButtonLink href="/courses">Browse courses</ButtonLink>}
      />
    );
  }

  const moduleCount = course.modules?.length ?? 0;
  const completed = enrollment?.progress?.length ?? 0;

  return (
    <article>
      {/* Navy header, matching the course card's band — the card and the page
          it opens should look like the same object. */}
      <header className="bg-hero-navy">
        <div className="mx-auto max-w-shell px-4 py-12 sm:px-6 lg:px-8">
          <Link
            href="/courses"
            className="inline-flex items-center gap-1 text-sm font-medium text-ink-inverse-muted hover:text-brand"
          >
            <span aria-hidden>←</span> All courses
          </Link>

          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-brand">
            Certificate course
          </p>
          <h1 className="mt-2 max-w-3xl text-3xl text-ink-inverse sm:text-4xl">
            {course.title}
          </h1>
          {course.description && (
            <p className="mt-4 max-w-prose text-base leading-relaxed text-ink-inverse-muted">
              {course.description}
            </p>
          )}

          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-inverse-muted">
            {moduleCount > 0 && (
              <li>
                {moduleCount} {moduleCount === 1 ? "lesson" : "lessons"}
              </li>
            )}
            <li>
              {course.accessDurationDays} days&apos; access from enrolment
            </li>
            <li>Verifiable certificate on completion</li>
          </ul>
        </div>
      </header>

      <div className="mx-auto max-w-shell px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <section>
            <h2 className="text-xl">Syllabus</h2>
            {moduleCount > 0 ? (
              <ol className="mt-4 divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
                {course.modules?.map((module, index) => {
                  const done = enrollment?.progress?.some(
                    (p) => p.moduleId === module.id,
                  );
                  return (
                    <li
                      key={module.id}
                      className="flex items-center gap-4 px-5 py-4"
                    >
                      <span
                        aria-hidden
                        className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-semibold ${
                          done
                            ? "bg-success-subtle text-success-text"
                            : "bg-surface-sunken text-ink-muted"
                        }`}
                      >
                        {done ? "✓" : index + 1}
                      </span>
                      <span className="min-w-0 flex-1 text-sm font-medium text-ink">
                        {module.title}
                      </span>
                      {done && <Badge tone="success">Completed</Badge>}
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className="mt-4 text-sm text-ink-muted">
                The syllabus for this course hasn&apos;t been published yet.
              </p>
            )}
          </section>

          {/* Sticky on desktop: the syllabus can run long, and the price
              shouldn't scroll away while you're reading what you'd be buying. */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            {!user && (
              <Card className="p-6">
                <h2 className="text-base">Enrol in this course</h2>
                <p className="mt-2 text-sm text-ink-muted">
                  Sign in to enrol. Your progress and certificate are tied to
                  your account.
                </p>
                <div className="mt-4">
                  <ButtonLink href={`/login?next=/courses/${course.id}`}>
                    Sign in to enrol
                  </ButtonLink>
                </div>
              </Card>
            )}

            {user && !enrollment && (
              <Card className="p-6">
                <h2 className="text-base">Enrol in this course</h2>
                <div className="mt-4">
                  <BuyButton
                    itemType="COURSE"
                    itemId={course.id}
                    label={course.title}
                    priceInPaise={course.priceInPaise}
                    onPaid={refreshEnrollment}
                  />
                </div>
                <ul className="mt-5 space-y-2 border-t border-line pt-4 text-sm text-ink-muted">
                  <li>{course.accessDurationDays} days&apos; access</li>
                  <li>Certificate with a code anyone can verify</li>
                  <li>Certificate stays valid after access ends</li>
                </ul>
              </Card>
            )}

            {enrollment && (
              <Card className="p-6">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-base">You&apos;re enrolled</h2>
                  <Badge tone={hasVideoAccess ? "success" : "neutral"}>
                    {hasVideoAccess ? "Active" : "Expired"}
                  </Badge>
                </div>

                <p className="mt-3 text-sm text-ink-muted">
                  Enrolled {formatDate(enrollment.enrolledAt)}. Video access{" "}
                  {hasVideoAccess ? "runs until" : "ended on"}{" "}
                  {formatDate(enrollment.expiresAt)}.
                </p>

                {moduleCount > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-ink">
                      {completed} of {moduleCount} lessons completed
                    </p>
                    <div
                      aria-hidden
                      className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-sunken"
                    >
                      <div
                        className="h-full rounded-full bg-brand"
                        style={{
                          width: `${(completed / moduleCount) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                <div className="mt-5 border-t border-line pt-4">
                  {hasVideoAccess ? (
                    // Cloudflare Stream is not provisioned yet, so there is no
                    // player to embed. Saying so is better than a dead <video>:
                    // the enrolment is real and the customer should know what
                    // they have.
                    //
                    // There is deliberately no "mark as watched" button either
                    // — the progress endpoint is meant to be driven by Stream's
                    // playback events, and a button would just be
                    // self-certification with an extra click
                    // (docs/TECH_DEBT.md).
                    <Alert tone="info">
                      Video playback isn&apos;t available in this environment
                      yet. Your enrolment is active and the lessons will appear
                      here once video hosting is switched on.
                    </Alert>
                  ) : (
                    <Alert tone="warning">
                      Your viewing window has closed, so the lessons are no
                      longer playable. Your certificate stays valid.
                    </Alert>
                  )}
                </div>

                {enrollment.certificate && (
                  <div className="mt-4 rounded-card border border-brand-border bg-brand-subtle p-4">
                    <p className="text-sm font-semibold text-ink">
                      Certificate issued
                    </p>
                    <p className="mt-1 text-sm text-ink-muted">
                      {formatDate(enrollment.certificate.issuedAt)}
                    </p>
                    <Link
                      href={`/verify/${enrollment.certificate.verificationCode}`}
                      className="mt-2 inline-block text-sm font-semibold text-primary hover:text-primary-hover"
                    >
                      Open the verification page
                    </Link>
                  </div>
                )}
              </Card>
            )}
          </aside>
        </div>
      </div>
    </article>
  );
}
