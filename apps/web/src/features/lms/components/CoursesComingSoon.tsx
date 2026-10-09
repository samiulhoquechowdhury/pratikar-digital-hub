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

import { Icon } from "@/shared/components/Icon";

const WHAT_TO_EXPECT: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: PlayCircle,
    title: "Short video lessons",
    body: "The law you actually run into — GST, property, running a business — explained in plain language, at your own pace.",
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
 * What /courses and every course page show until courses go live (see
 * COURSES_LIVE). It says what's coming, points to what's available today,
 * and gives anyone already enrolled the way to their courses.
 */
export function CoursesComingSoon() {
  return (
    <>
      <section className="relative overflow-hidden bg-surface-inverse">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(50rem_28rem_at_80%_-10%,theme(colors.navy.600),transparent_70%)]"
        />
        <div className="relative mx-auto max-w-shell px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <p className="inline-flex items-center gap-2 rounded-full border border-line-inverse bg-surface-inverse-raised/60 px-3 py-1 text-sm font-semibold text-brand">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-brand" />
            Coming soon
          </p>
          <h1 className="mt-6 max-w-3xl text-4xl leading-tight text-ink-inverse sm:text-6xl sm:leading-[1.05]">
            Certificate courses are on their way.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-inverse-muted sm:text-xl">
            We&apos;re recording short video courses on the law people use every
            day, each ending in a certificate you can share. Until then,
            everything else on Pratikar is ready to use.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/content-library"
              className="inline-flex items-center gap-2 rounded-control bg-brand px-5 py-3 text-sm font-semibold text-on-brand transition-colors hover:bg-brand-hover"
            >
              Explore the library
              <Icon icon={ArrowRight} />
            </Link>
            <Link
              href="/documents"
              className="inline-flex items-center gap-2 rounded-control border border-line-inverse px-5 py-3 text-sm font-semibold text-ink-inverse transition-colors hover:bg-surface-inverse-raised"
            >
              Create a document
            </Link>
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
          className="mt-2 font-display text-3xl font-semibold sm:text-4xl"
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
