import type { ContentCategory } from "@pratikar/types";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Briefcase,
  FileSignature,
  FileText,
  GraduationCap,
  House,
  IndianRupee,
  KeyRound,
  Laptop,
  ListChecks,
  Lock,
  MessageCircle,
  Receipt,
  Scale,
  ShieldCheck,
  Sparkles,
  UserCheck,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

import { Icon } from "@/shared/components/Icon";
import { COURSES_LIVE } from "@/shared/lib/features";
import { CONTENT_CATEGORY_LABELS } from "@/shared/lib/labels";
import { categoryHref, shelfHref } from "@/shared/lib/navigation";

import { countLabel, type CatalogueSummary } from "../lib/catalogueSummary";

import { HeroSearch } from "./HeroSearch";
import { HeroVisual } from "./HeroVisual";

/** The page's horizontal frame — every section lines up on it. */
const FRAME = "mx-auto max-w-shell px-4 sm:px-6 lg:px-8";

/** The one gold button style, used for each band's primary action. */
const GOLD_BUTTON =
  "inline-flex items-center gap-2 rounded-control bg-brand px-5 py-3 text-sm font-semibold text-on-brand transition-colors hover:bg-brand-hover";

/** A secondary action on navy: outlined, so it never competes with the gold. */
const INVERSE_BUTTON =
  "inline-flex items-center gap-2 rounded-control border border-line-inverse px-5 py-3 text-sm font-semibold text-ink-inverse transition-colors hover:bg-surface-inverse-raised";

function SectionHeading({
  eyebrow,
  title,
  description,
  id,
}: {
  eyebrow: string;
  title: string;
  description: string;
  id: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="text-sm font-semibold text-gold-ink">{eyebrow}</p>
      <h2
        id={id}
        className="mt-2 font-display text-3xl font-semibold sm:text-4xl"
      >
        {title}
      </h2>
      <p className="mt-4 text-lg leading-relaxed text-ink-muted">
        {description}
      </p>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────── hero */

/**
 * The opening banner: navy, full width, and in one screen it has to answer
 * "what is this site?" — the headline names the three things it sells, the
 * stats say how much of each, and the search lets someone skip straight to
 * the thing they came for.
 */
export function LandingHero({ summary }: { summary: CatalogueSummary }) {
  const stats = [
    { value: summary.library.FORM.count, label: "Legal forms" },
    { value: summary.library.CHECKLIST.count, label: "Checklists" },
    { value: summary.library.EBOOK.count, label: "E-books" },
    { value: summary.courses.count, label: "Courses" },
  ].filter((stat) => stat.value > 0);

  return (
    <section
      aria-labelledby="hero-title"
      className="relative overflow-hidden bg-surface-inverse"
    >
      {/* Light falling from the upper right, and a faint grid beneath it —
          depth without a photograph that would go stale. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_32rem_at_85%_-10%,theme(colors.navy.600),transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(theme(colors.navy.700)_1px,transparent_1px),linear-gradient(90deg,theme(colors.navy.700)_1px,transparent_1px)] [background-size:56px_56px] opacity-40 [mask-image:radial-gradient(70%_60%_at_30%_40%,black,transparent)]"
      />

      <div
        className={`${FRAME} relative grid grid-cols-[minmax(0,1fr)] items-center gap-14 pb-20 pt-14 sm:pt-20 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-12 lg:pb-24`}
      >
        <div>
          {/* The client's line, kept in its own words. Gold reads on navy. */}
          <p className="inline-flex items-center gap-2 rounded-full border border-line-inverse bg-surface-inverse-raised/60 px-3 py-1 text-sm font-medium text-brand">
            <Icon icon={Scale} size="xs" />
            Har Ghar Mein Kanooni Gyaan
          </p>
          <h1
            id="hero-title"
            className="mt-6 text-[2.5rem] leading-[1.08] text-ink-inverse sm:text-6xl sm:leading-[1.04]"
          >
            Legal documents, guides and courses —{" "}
            <span className="text-brand">all in one place.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-inverse-muted sm:text-xl">
            Generate a rent agreement or offer letter from a few answers,
            download ready-to-use forms and checklists, read plain-language
            e-books, and earn certificates — written for people who aren&apos;t
            lawyers.
          </p>

          <div className="mt-9">
            <HeroSearch tone="dark" />
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/documents" className={GOLD_BUTTON}>
              Create a document
              <Icon icon={ArrowRight} />
            </Link>
            <Link href="/content-library" className={INVERSE_BUTTON}>
              Browse the library
            </Link>
          </div>

          {stats.length > 0 && (
            <dl className="mt-12 grid max-w-xl grid-cols-2 gap-x-6 gap-y-6 border-t border-line-inverse pt-8 sm:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="flex flex-col">
                  <dt className="text-sm text-ink-inverse-muted">
                    {stat.label}
                  </dt>
                  <dd className="order-first font-display text-3xl font-semibold tabular-nums text-ink-inverse">
                    {countLabel(stat.value)}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        {/* Hidden on phones: a screen of scrolling before the content, and
            the headline already says what it shows. */}
        <div className="hidden md:block">
          <HeroVisual />
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────── offerings */

interface OfferingCard {
  href: string;
  title: string;
  icon: LucideIcon;
  description: string;
  count: number;
  unit: string;
  examples: string[];
  cta: string;
  /** Not on sale yet: shown with a "Coming soon" tag instead of a count. */
  soon?: boolean;
}

/**
 * "What's here", one card per thing the site sells, each with how many there
 * are and a few real titles — the titles do more to explain a form library
 * than any description of one.
 */
export function Offerings({ summary }: { summary: CatalogueSummary }) {
  const cards: OfferingCard[] = [
    {
      href: shelfHref("FORM"),
      title: "Legal forms",
      icon: FileSignature,
      description:
        "Agreements, affidavits, notices, bail applications and court formats — ready to fill in and use.",
      count: summary.library.FORM.count,
      unit: "forms",
      examples: summary.library.FORM.examples,
      cta: "Browse forms",
    },
    {
      href: shelfHref("CHECKLIST"),
      title: "Checklists",
      icon: ListChecks,
      description:
        "What to check before you sign, file or register — so nothing is missed.",
      count: summary.library.CHECKLIST.count,
      unit: "checklists",
      examples: summary.library.CHECKLIST.examples,
      cta: "Browse checklists",
    },
    {
      href: shelfHref("EBOOK"),
      title: "E-books",
      icon: BookOpen,
      description:
        "Plain-language handbooks on property, business compliance, courts and careers.",
      count: summary.library.EBOOK.count,
      unit: "e-books",
      examples: summary.library.EBOOK.examples,
      cta: "Browse e-books",
    },
    {
      href: "/courses",
      title: "Courses",
      icon: GraduationCap,
      description:
        "Short video courses that end in a certificate anyone can verify.",
      count: summary.courses.count,
      unit: "courses",
      examples: summary.courses.examples,
      cta: COURSES_LIVE ? "Explore courses" : "See what's coming",
      soon: !COURSES_LIVE,
    },
  ].filter((card) => card.count > 0 || card.soon);

  return (
    <section aria-labelledby="offerings-title" className={`${FRAME} py-20`}>
      <SectionHeading
        id="offerings-title"
        eyebrow="What you'll find here"
        title="Everything for the paperwork in your life"
        description="Whether you are renting a flat, hiring your first employee or going to court, start with the document — then understand what it means."
      />

      <div className="mt-12 grid gap-5 lg:grid-cols-3">
        {/* The generator leads: it's the one thing here no stationery shop
            can do — a finished document from your own answers. */}
        <Link
          href="/documents"
          className="group relative flex flex-col overflow-hidden rounded-card bg-primary p-8 text-ink-inverse transition-shadow hover:shadow-overlay lg:row-span-2"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(30rem_20rem_at_100%_0%,theme(colors.navy.500),transparent_70%)]"
          />
          <span className="relative grid h-12 w-12 place-items-center rounded-control bg-brand text-on-brand">
            <Icon icon={FileText} size="lg" />
          </span>
          <h3 className="relative mt-6 text-2xl font-semibold text-ink-inverse">
            Document generator
          </h3>
          <p className="relative mt-3 text-base leading-relaxed text-ink-inverse-muted">
            Answer a few plain questions and get a finished, ready-to-sign
            document as Word and PDF. Prefer talking? Fill it in by chat with
            the AI assistant, then check every answer before it&apos;s made.
          </p>
          <ul className="relative mt-8 space-y-3 text-sm text-ink-inverse">
            {[
              "No legal drafting — just your details",
              "Ready in minutes, GST invoice included",
              "Optional review by an advocate",
            ].map((point) => (
              <li key={point} className="flex items-center gap-2.5">
                <Icon icon={BadgeCheck} className="text-brand" />
                {point}
              </li>
            ))}
          </ul>
          {summary.templates.examples.length > 0 && (
            <div className="relative mt-auto pt-10">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-inverse-muted">
                Popular templates
              </p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {summary.templates.examples.map((title) => (
                  <li
                    key={title}
                    className="rounded-full border border-line-inverse bg-surface-inverse-raised/60 px-3 py-1 text-sm text-ink-inverse"
                  >
                    {title}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <span
            className={`relative inline-flex items-center gap-2 pt-8 text-sm font-semibold text-brand ${
              summary.templates.examples.length > 0 ? "" : "mt-auto"
            }`}
          >
            Create a document
            <Icon
              icon={ArrowRight}
              className="transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none"
            />
          </span>
        </Link>

        <div className="grid gap-5 sm:grid-cols-2 lg:col-span-2">
          {cards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="group flex flex-col rounded-card border border-line bg-surface p-6 transition-[border-color,box-shadow] hover:border-line-strong hover:shadow-raised"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="grid h-11 w-11 place-items-center rounded-control bg-primary-subtle text-primary">
                  <Icon icon={card.icon} size="md" />
                </span>
                <span className="rounded-full bg-brand-subtle px-2.5 py-1 text-xs font-semibold tabular-nums text-gold-ink">
                  {card.soon
                    ? "Coming soon"
                    : `${countLabel(card.count)} ${card.unit}`}
                </span>
              </div>
              <h3 className="mt-5 text-lg font-semibold">{card.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                {card.description}
              </p>
              {card.examples.length > 0 && (
                <ul className="mt-4 space-y-1.5 border-t border-line pt-4 text-sm text-ink">
                  {card.examples.map((example) => (
                    <li key={example} className="flex gap-2">
                      <span
                        aria-hidden
                        className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ink-subtle"
                      />
                      <span className="min-w-0 truncate">{example}</span>
                    </li>
                  ))}
                </ul>
              )}
              <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-semibold text-primary">
                {card.cta}
                <Icon
                  icon={ArrowRight}
                  size="xs"
                  className="transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none"
                />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────── categories */

const CATEGORY_ICONS: Record<ContentCategory, LucideIcon> = {
  PROPERTY_DOCUMENTATION: House,
  BUSINESS_COMPLIANCE: Briefcase,
  LEGAL_PRACTICE: Scale,
  DIGITAL_CAREER: Laptop,
  CHECKLISTS_REFERENCE: ListChecks,
};

const CATEGORY_BLURBS: Record<ContentCategory, string> = {
  PROPERTY_DOCUMENTATION: "Renting, buying, inheriting and registering",
  BUSINESS_COMPLIANCE: "Contracts, employees, GST and company law",
  LEGAL_PRACTICE: "Affidavits, notices, bail and court filings",
  DIGITAL_CAREER: "Tech contracts, freelancing and your career",
  CHECKLISTS_REFERENCE: "Step-by-step lists before you sign or file",
};

/** The library by area of law — for someone who knows the topic, not the form. */
export function CategoryBrowser({ summary }: { summary: CatalogueSummary }) {
  if (summary.categories.length === 0) return null;

  return (
    <section
      aria-labelledby="categories-title"
      className="border-y border-line bg-surface-sunken"
    >
      <div className={`${FRAME} py-20`}>
        <SectionHeading
          id="categories-title"
          eyebrow="Browse by topic"
          title="Find it by the area of law"
          description="Every form, checklist and e-book is filed under the part of life it's for."
        />
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {summary.categories.map((entry) => (
            <li key={entry.category}>
              <Link
                href={categoryHref(entry.category)}
                className="group flex h-full gap-4 rounded-card border border-line bg-surface p-5 transition-[border-color,box-shadow] hover:border-line-strong hover:shadow-raised"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-control bg-primary text-brand">
                  <Icon icon={CATEGORY_ICONS[entry.category]} size="md" />
                </span>
                <span className="min-w-0">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="text-base font-semibold text-ink">
                      {CONTENT_CATEGORY_LABELS[entry.category]}
                    </span>
                    <span className="shrink-0 text-sm tabular-nums text-ink-muted">
                      {entry.count}
                    </span>
                  </span>
                  <span className="mt-1 block text-sm text-ink-muted">
                    {CATEGORY_BLURBS[entry.category]}
                  </span>
                  <span className="mt-3 block truncate text-sm text-ink-subtle">
                    {entry.examples.join(" · ")}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────── assistant banner */

/** A sample exchange — illustrative, and hidden from screen readers. */
const SAMPLE_CHAT = [
  {
    from: "you",
    text: "My landlord wants an agreement for 11 months. What do I need?",
  },
  {
    from: "ai",
    text: "A Rent Agreement fits — I can fill it in with you. Shall we start with the landlord's and tenant's names?",
  },
] as const;

/**
 * The AI assistant, as a banner of its own: for the visitor who doesn't know
 * the name of the document they need, which is most first-time visitors.
 */
export function AssistantBanner() {
  return (
    <section aria-labelledby="assistant-title" className={`${FRAME} py-20`}>
      <div className="relative overflow-hidden rounded-card bg-surface-inverse px-6 py-12 sm:px-12 lg:py-16">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(36rem_24rem_at_0%_100%,theme(colors.navy.600),transparent_70%)]"
        />
        <div className="relative grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-brand">
              <Icon icon={Sparkles} />
              AI assistant
            </p>
            <h2
              id="assistant-title"
              className="mt-3 font-display text-3xl font-semibold leading-tight text-ink-inverse sm:text-4xl"
            >
              Not sure which document you need? Just ask.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-inverse-muted sm:text-lg">
              Describe your situation in your own words, in English or Hindi.
              The assistant points you to the right document, checklist or
              course — and can fill a document in with you, one question at a
              time.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/assistant" className={GOLD_BUTTON}>
                Ask the assistant
                <Icon icon={MessageCircle} />
              </Link>
            </div>
            <p className="mt-5 text-xs text-ink-inverse-muted">
              The assistant explains and recommends; it doesn&apos;t give legal
              advice on your case.
            </p>
          </div>

          <div aria-hidden className="space-y-3">
            {SAMPLE_CHAT.map((message) => (
              <p
                key={message.text}
                className={
                  message.from === "you"
                    ? "ml-auto max-w-[85%] rounded-card rounded-br-sm bg-brand px-4 py-3 text-sm leading-relaxed text-on-brand"
                    : "max-w-[85%] rounded-card rounded-bl-sm border border-line-inverse bg-surface-inverse-raised px-4 py-3 text-sm leading-relaxed text-ink-inverse"
                }
              >
                {message.text}
              </p>
            ))}
            <p className="flex max-w-[85%] items-center gap-3 rounded-card border border-line-inverse bg-surface px-4 py-3 text-sm">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-control bg-primary-subtle text-primary">
                <Icon icon={FileText} />
              </span>
              <span>
                <span className="block font-semibold text-ink">
                  Rent Agreement
                </span>
                <span className="block text-ink-muted">
                  Answer by chat · check every answer before it&apos;s made
                </span>
              </span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────── how it works */

const STEPS: { title: string; body: string; icon: LucideIcon }[] = [
  {
    title: "Find what you need",
    body: "Search, browse by topic, or describe your situation to the assistant.",
    icon: Sparkles,
  },
  {
    title: "Fill in your details",
    body: "Answer plain questions for a generated document, or download a form to complete yourself.",
    icon: FileText,
  },
  {
    title: "Pay once, securely",
    body: "One price with GST shown, paid through Razorpay. A GST invoice comes with every order.",
    icon: IndianRupee,
  },
  {
    title: "Download — or get it reviewed",
    body: "Word and PDF, ready to print and sign. Add an advocate's review if you want a second pair of eyes.",
    icon: UserCheck,
  },
];

export function HowItWorks() {
  return (
    <section aria-labelledby="how-title" className={`${FRAME} py-20`}>
      <SectionHeading
        id="how-title"
        eyebrow="How it works"
        title="From question to signed paper in four steps"
        description="No appointments and no jargon — and you only pay for what you take."
      />
      <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, index) => (
          <li
            key={step.title}
            className="relative rounded-card border border-line bg-surface p-6"
          >
            <div className="flex items-center justify-between">
              <span className="grid h-11 w-11 place-items-center rounded-control bg-primary-subtle text-primary">
                <Icon icon={step.icon} size="md" />
              </span>
              <span
                aria-hidden
                className="font-display text-4xl font-semibold text-line-strong"
              >
                {index + 1}
              </span>
            </div>
            <h3 className="mt-5 text-lg font-semibold">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              {step.body}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────── trust */

/**
 * Why someone should believe any of this. Only what the product actually
 * does — no customer counts, ratings or testimonials until there are real
 * ones. On a site selling legal material, an invented number is a worse
 * first impression than a plain one.
 */
const ASSURANCES: { title: string; body: string; icon: LucideIcon }[] = [
  {
    title: "Reviewed before publishing",
    body: "Every template and course passes an internal review before it reaches the catalogue.",
    icon: ShieldCheck,
  },
  {
    title: "Advocate review on request",
    body: "Send a generated document to a licensed advocate, who checks it and returns it to your dashboard.",
    icon: UserCheck,
  },
  {
    title: "Secure payments",
    body: "Paid through Razorpay. Your card details never reach our servers.",
    icon: Lock,
  },
  {
    title: "GST invoice, every time",
    body: "One price per item with tax shown — no subscription and no recurring charge.",
    icon: Receipt,
  },
  {
    title: "Private to your account",
    body: "Your answers and documents stay in your account, with download links that expire.",
    icon: KeyRound,
  },
  {
    title: "Certificates you can check",
    body: "Each course certificate carries a code anyone can verify on this site, no account needed.",
    icon: BadgeCheck,
  },
];

export function Assurances() {
  return (
    <section
      aria-labelledby="trust-title"
      className="border-t border-line bg-surface-sunken"
    >
      <div className={`${FRAME} py-20`}>
        <SectionHeading
          id="trust-title"
          eyebrow="Why Pratikar"
          title="Built for documents you'll actually sign"
          description="Legal paperwork has to be right. Here is what we do to make sure it is."
        />
        <ul className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {ASSURANCES.map((item) => (
            <li key={item.title} className="flex gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-control border border-line bg-surface text-primary">
                <Icon icon={item.icon} size="md" />
              </span>
              <div>
                <h3 className="text-base font-semibold">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                  {item.body}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────── closing band */

export function ClosingBanner() {
  return (
    <section aria-labelledby="closing-title" className="bg-surface-inverse">
      <div
        className={`${FRAME} flex flex-col items-start gap-8 py-16 lg:flex-row lg:items-center lg:justify-between`}
      >
        <div className="max-w-2xl">
          <h2
            id="closing-title"
            className="font-display text-3xl font-semibold leading-tight text-ink-inverse sm:text-4xl"
          >
            Start with the document you need today.
          </h2>
          <p className="mt-3 text-lg text-ink-inverse-muted">
            Browse everything freely — sign in only when you&apos;re ready to
            make or buy something.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/documents" className={GOLD_BUTTON}>
            Create a document
            <Icon icon={ArrowRight} />
          </Link>
          <Link href="/contact" className={INVERSE_BUTTON}>
            Talk to us
          </Link>
        </div>
      </div>
    </section>
  );
}
