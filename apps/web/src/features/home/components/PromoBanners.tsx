import {
  ArrowRight,
  BadgeCheck,
  GraduationCap,
  PlayCircle,
  Scale,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

import { Icon } from "@/shared/components/Icon";

/**
 * The courses banner — the one full-width navy block on the page.
 *
 * Navy is kept off the chrome in this design so that it means something
 * where it does appear: a single strong band between shelves marks the
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
              Certificate courses
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
                Explore courses
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

/**
 * Two lighter banners for the services that sit beside the catalogue rather
 * than in it. Both describe something the product really does: every
 * template carries a review price, and the assistant exists — labelled
 * Preview because its answers are scripted until the RAG chatbot ships.
 */
export function FeatureBanners() {
  return (
    <section className="mx-auto max-w-shell px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid gap-5 md:grid-cols-2">
        <Link
          href="/documents"
          className="group relative flex flex-col overflow-hidden rounded-card border border-brand-border bg-brand-subtle p-8 transition-shadow hover:shadow-raised sm:p-10"
        >
          <span className="grid h-12 w-12 place-items-center rounded-card bg-surface text-gold-ink shadow-card">
            <Icon icon={Scale} size="lg" />
          </span>
          <h2 className="mt-6 text-2xl font-semibold">
            Want a lawyer to check it?
          </h2>
          <p className="mt-2 max-w-md text-base leading-relaxed text-ink-muted">
            Add a lawyer&apos;s review to any document before you sign. They
            read what you filled in and send it back with their notes.
          </p>
          <span className="mt-8 inline-flex items-center gap-1.5 text-sm font-semibold text-ink">
            Choose a document
            <Icon
              icon={ArrowRight}
              className="transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none"
            />
          </span>
        </Link>

        <Link
          href="/assistant"
          className="group relative flex flex-col overflow-hidden rounded-card border border-primary-border bg-primary-subtle p-8 transition-shadow hover:shadow-raised sm:p-10"
        >
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-card bg-surface text-primary shadow-card">
              <Icon icon={Sparkles} size="lg" />
            </span>
            <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              Preview
            </span>
          </div>
          <h2 className="mt-6 text-2xl font-semibold">
            Not sure which document you need?
          </h2>
          <p className="mt-2 max-w-md text-base leading-relaxed text-ink-muted">
            Describe your situation in plain words and get pointed to a
            template, course or guide. An early preview — try it and see.
          </p>
          <span className="mt-8 inline-flex items-center gap-1.5 text-sm font-semibold text-ink">
            Ask the assistant
            <Icon
              icon={ArrowRight}
              className="transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none"
            />
          </span>
        </Link>
      </div>
    </section>
  );
}
