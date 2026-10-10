import {
  ArrowRight,
  BadgeCheck,
  GraduationCap,
  PlayCircle,
} from "lucide-react";
import Link from "next/link";

import { Icon } from "@/shared/components/Icon";
import { COURSES_LIVE } from "@/shared/lib/features";

import {
  FRAME,
  GHOST_INVERSE_BUTTON,
  GOLD_BUTTON,
  SectionHeading,
} from "./Landing";
import { CertificateArt } from "./illustrations";

/**
 * Courses: a navy band with the certificate itself as the picture — the
 * thing a learner walks away with, and the reason to finish.
 */
export function CoursesBanner() {
  return (
    <section aria-labelledby="courses-title" className={`${FRAME} py-12`}>
      <div className="relative overflow-hidden rounded-[2rem] bg-hero-navy px-6 py-14 shadow-overlay sm:px-14 lg:py-16">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-20 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(closest-side,rgb(212_175_55/0.16),transparent)]"
        />
        <div className="relative grid items-center gap-12 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <SectionHeading
              id="courses-title"
              tone="dark"
              eyebrow={COURSES_LIVE ? "Certificate courses" : "Coming soon"}
              title="Learn the law you actually use — and prove it."
              description="Short video courses on GST, property and running a business. Finish one and get a certificate with a code anyone can check."
            />
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-ink-inverse">
              {[
                { icon: PlayCircle, label: "Short lessons, your pace" },
                { icon: GraduationCap, label: "A test after each lesson" },
                { icon: BadgeCheck, label: "Verifiable certificate" },
              ].map((point) => (
                <li key={point.label} className="flex items-center gap-2">
                  <Icon icon={point.icon} className="text-brand" />
                  {point.label}
                </li>
              ))}
            </ul>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/courses" className={GOLD_BUTTON}>
                {COURSES_LIVE ? "Explore courses" : "See what's coming"}
                <Icon icon={ArrowRight} />
              </Link>
              <Link href="/verify" className={GHOST_INVERSE_BUTTON}>
                Verify a certificate
              </Link>
            </div>
          </div>
          <CertificateArt className="mx-auto w-full max-w-md rotate-[-3deg] drop-shadow-2xl" />
        </div>
      </div>
    </section>
  );
}
