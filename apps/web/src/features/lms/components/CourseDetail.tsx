"use client";

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

  if (isLoading) return <p>Loading…</p>;
  if (error) return <p role="alert">{error}</p>;
  if (!course) return <p>This course isn&apos;t available.</p>;

  return (
    <article>
      <h1>{course.title}</h1>
      {course.description && <p>{course.description}</p>}
      <p>{course.accessDurationDays} days&apos; access from enrolment.</p>

      <h2>Syllabus</h2>
      {course.modules && course.modules.length > 0 ? (
        <ol>
          {course.modules.map((module) => (
            <li key={module.id}>{module.title}</li>
          ))}
        </ol>
      ) : (
        <p>The syllabus for this course hasn&apos;t been published yet.</p>
      )}

      <h2>Access</h2>
      {!user && (
        <p>
          <Link href="/login">Sign in</Link> to enrol.
        </p>
      )}

      {user && !enrollment && (
        <BuyButton
          itemType="COURSE"
          itemId={course.id}
          label={course.title}
          priceInPaise={course.priceInPaise}
          onPaid={refreshEnrollment}
        />
      )}

      {enrollment && (
        <div>
          <p>
            Enrolled {formatDate(enrollment.enrolledAt)}. Video access{" "}
            {hasVideoAccess ? "runs until" : "ended on"}{" "}
            {formatDate(enrollment.expiresAt)}.
          </p>

          <p>
            {enrollment.progress?.length ?? 0} of {course.modules?.length ?? 0}{" "}
            lessons completed.
          </p>

          {hasVideoAccess ? (
            // Cloudflare Stream is not provisioned yet, so there is no player
            // to embed. Saying so is better than a dead <video> element: the
            // enrolment is real and the customer should know what they have.
            //
            // There is deliberately no "mark as watched" button either — the
            // progress endpoint is meant to be driven by Stream's playback
            // events, and a button would just be self-certification with an
            // extra click (docs/TECH_DEBT.md).
            <p>
              Video playback isn&apos;t available in this environment yet. Your
              enrolment is active and the lessons will appear here once video
              hosting is switched on.
            </p>
          ) : (
            <p>
              Your viewing window has closed, so the lessons are no longer
              playable. Your certificate stays valid.
            </p>
          )}

          {enrollment.certificate && (
            <p>
              Certificate issued {formatDate(enrollment.certificate.issuedAt)} —{" "}
              <Link href={`/verify/${enrollment.certificate.verificationCode}`}>
                verification page
              </Link>
            </p>
          )}
        </div>
      )}

      <p>
        <Link href="/courses">Back to courses</Link>
      </p>
    </article>
  );
}
