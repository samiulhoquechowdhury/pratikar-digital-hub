import Link from "next/link";

import { FeaturedCourses, HeroSearch } from "@/features/home";

/**
 * Category tiles, in the pattern Coursera and Udemy open with: show the
 * catalogue's shape before asking for anything. Each one is a real
 * destination, not a marketing label.
 */
const CATEGORIES = [
  {
    href: "/documents",
    label: "Rent & property",
    hint: "Agreements, notices, sale deeds",
    icon: "🏠",
  },
  {
    href: "/documents",
    label: "Employment",
    hint: "Offer letters, contracts, NDAs",
    icon: "📄",
  },
  {
    href: "/documents",
    label: "Business",
    hint: "Partnerships, vendors, compliance",
    icon: "🏢",
  },
  {
    href: "/content-library?category=BUSINESS_COMPLIANCE",
    label: "GST & filings",
    hint: "Guides that keep you compliant",
    icon: "🧾",
  },
  {
    href: "/content-library?category=CHECKLISTS_REFERENCE",
    label: "Checklists",
    hint: "What to check before you sign",
    icon: "✅",
  },
  {
    href: "/courses",
    label: "Certificate courses",
    hint: "Learn it properly, prove it",
    icon: "🎓",
  },
];

const PRODUCTS = [
  {
    href: "/documents",
    title: "Document templates",
    description:
      "Answer a few plain-language questions and get a ready-to-sign document as Word and PDF. Add a lawyer review if you want a second pair of eyes.",
    cta: "Browse templates",
  },
  {
    href: "/content-library",
    title: "Content library",
    description:
      "E-books and checklists on compliance, property paperwork, and running a business in India. Buy once, keep it.",
    cta: "Browse the library",
  },
  {
    href: "/courses",
    title: "Certificate courses",
    description:
      "Video courses with a verifiable certificate on completion, and six months' access from the day you enrol.",
    cta: "See courses",
  },
];

const STEPS = [
  {
    title: "Pick a template",
    body: "Covering rent, employment, business, and property — each one drafted and reviewed before it reaches the catalogue.",
  },
  {
    title: "Fill in the form",
    body: "Plain-language questions, no legal drafting required. Your answers stay private to your account.",
  },
  {
    title: "Pay and download",
    body: "Get your document as a Word file and a PDF, ready to print and sign. GST invoice included.",
  },
];

/**
 * Why someone should believe any of this. Deliberately claims only what the
 * product actually does — no student counts, no ratings, no testimonials
 * until there are real ones. On a site selling legal material, an invented
 * number is a worse first impression than a plain one.
 */
const ASSURANCES = [
  {
    title: "Reviewed before publishing",
    body: "Every template and course passes an internal review before it appears in the catalogue.",
  },
  {
    title: "Certificates you can check",
    body: "Each certificate carries a code anyone can verify on this site, without an account.",
  },
  {
    title: "Priced up front",
    body: "One price per document or course, GST shown separately. No subscription, no recurring charge.",
  },
];

export default function HomePage() {
  return (
    <>
      {/*
        The brand sheet's hero: deep navy gradient, the Hindi line in gold, the
        English line in white. Gold reaches 7.86:1 on this background — it is
        the one place gold is safe as large text.
      */}
      <section className="bg-hero-navy">
        <div className="mx-auto max-w-shell px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="max-w-2xl">
            <h1 className="text-4xl sm:text-5xl">
              <span className="block text-ink-inverse">Har Ghar Mein</span>
              <span className="mt-1 block text-brand">Kanooni Gyaan</span>
            </h1>

            <div
              aria-hidden
              className="mt-6 h-px w-24 bg-gradient-to-r from-brand to-transparent"
            />

            <p className="mt-6 text-xl font-medium text-ink-inverse">
              Legal knowledge in every home.
            </p>
            <p className="mt-4 max-w-prose text-base leading-relaxed text-ink-inverse-muted">
              Documents you can generate in minutes, courses that end in a
              certificate, and guides written for people who aren&apos;t
              lawyers.
            </p>

            <div className="mt-8">
              <HeroSearch />
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/documents"
                className="rounded-control bg-brand px-6 py-3 text-sm font-semibold text-on-brand transition-colors hover:bg-brand-hover"
              >
                Create a document
              </Link>
              <Link
                href="/courses"
                className="rounded-control border border-ink-inverse-muted/40 px-6 py-3 text-sm font-semibold text-ink-inverse transition-colors hover:bg-surface-inverse-raised"
              >
                Explore courses
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories immediately under the hero — the browse-first pattern. */}
      <section className="border-b border-line bg-surface">
        <div className="mx-auto max-w-shell px-4 py-12 sm:px-6 lg:px-8">
          <h2 className="text-lg">Start with what you need</h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((category) => (
              <li key={category.label}>
                <Link
                  href={category.href}
                  className="flex items-start gap-3 rounded-card border border-line bg-surface p-4 transition-colors hover:border-brand-border hover:bg-brand-subtle"
                >
                  <span aria-hidden className="text-xl leading-none">
                    {category.icon}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-ink">
                      {category.label}
                    </span>
                    <span className="mt-0.5 block text-xs text-ink-muted">
                      {category.hint}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <FeaturedCourses />

      <section className="border-y border-line bg-canvas">
        <div className="mx-auto max-w-shell px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="text-2xl">Three ways to use this site</h2>
          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PRODUCTS.map((product) => (
              <li
                key={product.title}
                className="flex flex-col rounded-card border border-line bg-surface p-6 shadow-card transition-shadow hover:shadow-raised"
              >
                <h3 className="text-lg">{product.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">
                  {product.description}
                </p>
                <Link
                  href={product.href}
                  className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary-hover"
                >
                  {product.cta}
                  <span aria-hidden>→</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-shell px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-2xl">How a document works</h2>
        <ol className="mt-8 grid gap-8 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title}>
              <span
                aria-hidden
                className="grid h-9 w-9 place-items-center rounded-full bg-primary text-sm font-semibold text-ink-inverse"
              >
                {index + 1}
              </span>
              <h3 className="mt-4 text-base">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* AI band. Navy so it reads as a product announcement rather than
          another catalogue row, and honest about not being ready. */}
      <section className="bg-surface-inverse-deep">
        <div className="mx-auto max-w-shell px-4 py-16 sm:px-6 lg:px-8">
          <div className="sm:flex sm:items-center sm:justify-between sm:gap-10">
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand">
                In development
              </span>
              <h2 className="mt-4 text-2xl text-ink-inverse">
                An assistant that speaks plain language
              </h2>
              <p className="mt-3 text-base leading-relaxed text-ink-inverse-muted">
                Describe your situation and get pointed at the right template,
                course, or checklist — and have the document filled in by
                answering questions instead of reading a form.
              </p>
            </div>
            <Link
              href="/assistant"
              className="mt-6 inline-block shrink-0 rounded-control border border-brand px-5 py-3 text-sm font-semibold text-brand transition-colors hover:bg-brand hover:text-on-brand sm:mt-0"
            >
              See what&apos;s coming
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-surface">
        <div className="mx-auto max-w-shell px-4 py-16 sm:px-6 lg:px-8">
          <ul className="grid gap-8 sm:grid-cols-3">
            {ASSURANCES.map((assurance) => (
              <li key={assurance.title}>
                <h3 className="text-base">{assurance.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                  {assurance.body}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-shell px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-card border border-line bg-surface p-8 shadow-card sm:flex sm:items-center sm:justify-between sm:gap-8">
          <div>
            <h2 className="text-xl">Checking someone&apos;s certificate?</h2>
            <p className="mt-2 text-sm text-ink-muted">
              Enter the code printed on it to confirm we issued it. No account
              needed.
            </p>
          </div>
          <Link
            href="/verify"
            className="mt-5 inline-block shrink-0 rounded-control bg-brand px-5 py-3 text-sm font-semibold text-on-brand transition-colors hover:bg-brand-hover sm:mt-0"
          >
            Verify a certificate
          </Link>
        </div>
      </section>
    </>
  );
}
