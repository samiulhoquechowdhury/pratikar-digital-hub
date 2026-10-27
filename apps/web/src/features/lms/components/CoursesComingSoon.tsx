import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  ClipboardCheck,
  FileText,
  PlayCircle,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

import { CertificateArt } from "@/features/home/components/illustrations";
import {
  COURSE_AREAS,
  PLANNED_COURSES,
  type CourseArea,
} from "@/shared/catalogue/certificateCourses";
import { Icon } from "@/shared/components/Icon";

const WHAT_TO_EXPECT: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: PlayCircle,
    title: "Short video lessons",
    body: "Law, business and career skills — GST, contracts, litigation, digital marketing and more — explained plainly, at your own pace.",
  },
  {
    icon: ClipboardCheck,
    title: "Quizzes as you go",
    body: "Check what you've learnt at the end of each part before moving on.",
  },
  {
    icon: BadgeCheck,
    title: "A certificate anyone can verify",
    body: "Finish a course and get a certificate with a code an employer or client can check on this site.",
  },
];

/**
 * Every course being prepared, by area. The home page's course cards link
 * to an entry here (#slug), and its tabs to an area (#legal).
 */
function PlannedCourseList() {
  return (
    <div className="mt-16 space-y-12">
      <h2 className="text-[1.5rem] font-bold sm:text-[1.75rem]">
        {PLANNED_COURSES.length} courses in preparation
      </h2>
      {(Object.keys(COURSE_AREAS) as CourseArea[]).map((area) => {
        const courses = PLANNED_COURSES.filter((c) => c.area === area);
        return (
          <section
            key={area}
            id={area}
            aria-labelledby={`${area}-title`}
            className="scroll-mt-28"
          >
            <h3 id={`${area}-title`} className="text-lg font-semibold">
              {COURSE_AREAS[area]}{" "}
              <span className="font-normal text-ink-muted">
                · {courses.length}
              </span>
            </h3>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <li
                  key={course.slug}
                  id={course.slug}
                  className="scroll-mt-28 rounded-card border border-line bg-surface p-4 target:border-noir target:ring-2 target:ring-noir/15"
                >
                  <p className="font-semibold leading-snug text-ink">
                    {course.title}
                  </p>
                  <p className="mt-1 text-sm text-ink-muted">
                    {course.duration} · {course.modules} modules · Certificate
                  </p>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

/**
 * What /courses and every course page show until courses go live (see
 * COURSES_LIVE). It says what's coming, points to what's available today,
 * and gives anyone already enrolled the way to their courses.
 */
export function CoursesComingSoon() {
  return (
    <>
      {/* The home page's banner, for the one section still to come. */}
      <section className="mx-auto max-w-shell px-4 pt-6 sm:px-6 sm:pt-8 lg:px-8">
        <div className="relative isolate grid grid-cols-[minmax(0,1fr)] overflow-hidden rounded-2xl bg-banner-lilac lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <span
            aria-hidden
            className="absolute -right-24 top-1/2 -z-10 hidden h-[30rem] w-[30rem] -translate-y-1/2 rounded-full bg-white/70 lg:block"
          />
          <div className="px-6 py-12 sm:px-12 lg:py-16 lg:pl-14">
            <p className="inline-flex rounded bg-noir px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-white">
              Coming soon
            </p>
            <h1 className="mt-5 max-w-xl text-[2.25rem] font-extrabold leading-tight text-noir sm:text-[2.75rem]">
              Certificate courses are on their way.
            </h1>
            <p className="mt-4 max-w-lg text-lg leading-relaxed text-noir/75">
              We&apos;re recording practical courses on law, business and
              careers, each ending in a certificate you can share. Until then,
              everything else on Pratikar is ready to use.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/content-library" className="btn-noir">
                Explore the library
                <Icon icon={ArrowRight} />
              </Link>
              <Link href="/documents" className="btn-line">
                Create a document
              </Link>
            </div>
          </div>
          <div
            aria-hidden
            className="relative hidden items-center justify-center p-10 lg:flex"
          >
            <CertificateArt className="w-full max-w-md rotate-[-4deg] drop-shadow-2xl" />
          </div>
        </div>
      </section>

      <section
        aria-labelledby="expect-title"
        className="mx-auto max-w-shell px-4 py-20 sm:px-6 lg:px-8"
      >
        <p className="text-sm font-semibold text-gold-ink">What to expect</p>
        <h2
          id="expect-title"
          className="mt-2 text-[1.75rem] font-bold sm:text-[2.125rem]"
        >
          Learn it properly, and prove it
        </h2>
        <ul className="mt-10 grid gap-6 md:grid-cols-3">
          {WHAT_TO_EXPECT.map((item) => (
            <li
              key={item.title}
              className="rounded-card border border-line bg-surface p-6"
            >
              <span className="grid h-11 w-11 place-items-center rounded-control bg-primary-subtle text-primary">
                <Icon icon={item.icon} size="md" />
              </span>
              <h3 className="mt-5 text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                {item.body}
              </p>
            </li>
          ))}
        </ul>

        <PlannedCourseList />

        <div className="mt-12 grid gap-4 md:grid-cols-2">
          <Link
            href="/content-library?shelf=ebooks"
            className="group flex items-center gap-4 rounded-card border border-line bg-surface-sunken p-5 transition-colors hover:border-line-strong"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-control bg-surface text-primary">
              <Icon icon={BookOpen} size="md" />
            </span>
            <span>
              <span className="block font-semibold text-ink">
                Want to start learning now?
              </span>
              <span className="block text-sm text-ink-muted">
                Our e-books cover the same ground in plain language.
              </span>
            </span>
          </Link>
          <Link
            href="/dashboard/courses"
            className="group flex items-center gap-4 rounded-card border border-line bg-surface-sunken p-5 transition-colors hover:border-line-strong"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-control bg-surface text-primary">
              <Icon icon={FileText} size="md" />
            </span>
            <span>
              <span className="block font-semibold text-ink">
                Already enrolled?
              </span>
              <span className="block text-sm text-ink-muted">
                Your courses and certificates are in My courses.
              </span>
            </span>
          </Link>
        </div>
      </section>
    </>
  );
}
