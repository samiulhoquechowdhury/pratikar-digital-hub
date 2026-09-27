"use client";

import {
  Alert,
  Badge,
  ButtonLink,
  EmptyState,
  SkeletonText,
} from "@pratikar/ui";
import { Check } from "lucide-react";
import Link from "next/link";

import { BuyButton } from "@/features/payments";
import { Icon } from "@/shared/components/Icon";
import {
  Breadcrumbs,
  FeatureList,
  ProductHeading,
  ProductLayout,
  ProductSection,
  PurchaseCard,
} from "@/shared/components/ProductPage";
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
 * pay rather than after. Built on the shared ProductPage blocks, so it reads
 * as the same shop as a template or a library item.
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

  if (isLoading || error || !course) {
    return (
      <div className="mx-auto max-w-shell px-4 py-12 sm:px-6 lg:px-8">
        {isLoading ? (
          <SkeletonText lines={6} label="Loading this course…" />
        ) : error ? (
          <Alert tone="danger" role="alert">
            {error}
          </Alert>
        ) : (
          <EmptyState
            title="This course isn't available"
            description="It may have been unpublished, or the link may be wrong."
            action={<ButtonLink href="/courses">Browse courses</ButtonLink>}
          />
        )}
      </div>
    );
  }

  const moduleCount = course.modules?.length ?? 0;
  const completed = enrollment?.progress?.length ?? 0;

  const enrolledPanel = enrollment && (
    <div className="rounded-card border border-line bg-surface p-6 shadow-raised">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">You&apos;re enrolled</h2>
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
        <div className="mt-5">
          <p className="text-sm font-medium text-ink">
            {completed} of {moduleCount} lessons completed
          </p>
          <div
            aria-hidden
            className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-sunken"
          >
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${(completed / moduleCount) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* The primary action once you own the course — the page becomes a
          doorway to the classroom rather than a sales page you've already
          acted on. */}
      <ButtonLink href={`/learn/${enrollment.id}`} className="mt-5 w-full">
        {completed > 0 ? "Continue learning" : "Start learning"}
      </ButtonLink>

      {!hasVideoAccess && (
        <div className="mt-5">
          <Alert tone="warning">
            Your viewing window has closed, so the lessons are no longer
            playable. Your certificate stays valid.
          </Alert>
        </div>
      )}

      {enrollment.certificate && (
        <div className="mt-5 rounded-card border border-brand-border bg-brand-subtle p-4">
          <p className="text-sm font-semibold text-ink">Certificate issued</p>
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
    </div>
  );

  return (
    <ProductLayout
      header={
        <>
          <Breadcrumbs
            trail={[{ href: "/courses", label: "Courses" }]}
            current={course.title}
          />

          <ProductHeading
            kind="course"
            title={course.title}
            description={course.description}
            meta={[
              ...(moduleCount > 0
                ? [`${moduleCount} ${moduleCount === 1 ? "lesson" : "lessons"}`]
                : []),
              `${course.accessDurationDays} days' access`,
              "Certificate included",
            ]}
          />
        </>
      }
      aside={
        enrolledPanel || (
          <PurchaseCard>
            <BuyButton
              itemType="COURSE"
              itemId={course.id}
              label={course.title}
              priceInPaise={course.priceInPaise}
              onPaid={refreshEnrollment}
            />
          </PurchaseCard>
        )
      }
    >
      <ProductSection title="What you get">
        <FeatureList
          items={[
            `${course.accessDurationDays} days of video access`,
            "Learn at your own pace",
            "Certificate with a code anyone can verify",
            "Certificate stays valid after access ends",
          ]}
        />
      </ProductSection>

      <ProductSection title="Syllabus">
        {moduleCount > 0 ? (
          <ol className="divide-y divide-line overflow-hidden rounded-card border border-line">
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
                    {done ? <Icon icon={Check} /> : index + 1}
                  </span>
                  <span className="min-w-0 flex-1 text-base text-ink">
                    {done && <span className="sr-only">Completed: </span>}
                    {module.title}
                  </span>
                  {done && <Badge tone="success">Completed</Badge>}
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="text-ink-muted">
            The syllabus for this course hasn&apos;t been published yet.
          </p>
        )}
      </ProductSection>
    </ProductLayout>
  );
}
