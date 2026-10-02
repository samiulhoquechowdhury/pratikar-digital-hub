import {
  ArrowRight,
  BadgeCheck,
  GraduationCap,
  PlayCircle,
} from "lucide-react";
import Link from "next/link";

import { Icon } from "@/shared/components/Icon";
import { COURSES_LIVE } from "@/shared/lib/features";

/**
 * The courses banner: a navy block between the shelves, marking the
 * product the business most wants to grow. Gold works as text only here, on
 * navy (7.86:1).
 */
export function CoursesBanner() {
  return (
    <section className="mx-auto max-w-shell px-4 py-12 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-card bg-primary px-6 py-12 sm:px-12 lg:py-16">
        {/* Soft light from the upper right, so the block has depth rather
            than being a flat slab of colour. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(40rem_24rem_at_90%_0%,theme(colors.navy.600),transparent_70%)]"
        />
        <div className="relative grid items-center gap-10 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="text-sm font-semibold text-brand">
              {COURSES_LIVE ? "Certificate courses" : "Coming soon"}
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold leading-tight text-ink-inverse sm:text-4xl">
              Learn the law you actually use — and prove it.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-inverse-muted sm:text-lg">
              Short video courses on GST, property and running a business.
              Finish one and get a certificate with a code anyone can check.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/courses"
                className="inline-flex items-center gap-2 rounded-control bg-brand px-5 py-3 text-sm font-semibold text-on-brand transition-colors hover:bg-brand-hover"
              >
                {COURSES_LIVE ? "Explore courses" : "See what's coming"}
                <Icon icon={ArrowRight} />
              </Link>
              <Link
                href="/verify"
                className="inline-flex items-center gap-2 rounded-control px-4 py-3 text-sm font-semibold text-ink-inverse transition-colors hover:bg-surface-inverse-raised"
              >
                Verify a certificate
              </Link>
            </div>
          </div>

          {/* What a course is, in three lines — decorative, the copy on the
              left carries the meaning. */}
          <ul aria-hidden className="grid gap-3">
            {[
              {
                icon: PlayCircle,
                title: "Watch",
                body: "Short lessons, at your own pace",
              },
              {
                icon: GraduationCap,
                title: "Complete",
                body: "Finish every lesson in the course",
              },
              {
                icon: BadgeCheck,
                title: "Prove it",
                body: "A certificate anyone can verify",
              },
            ].map((step) => (
              <li
                key={step.title}
                className="flex items-center gap-4 rounded-card border border-line-inverse bg-surface-inverse-raised/60 px-5 py-4 backdrop-blur-sm"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-control bg-primary text-brand">
                  <Icon icon={step.icon} size="md" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-ink-inverse">
                    {step.title}
                  </span>
                  <span className="block text-sm text-ink-inverse-muted">
                    {step.body}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
