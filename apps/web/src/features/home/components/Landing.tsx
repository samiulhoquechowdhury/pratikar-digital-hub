import type { ContentCategory } from "@pratikar/types";
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  FileText,
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
import type { ReactNode } from "react";

import { Icon } from "@/shared/components/Icon";
import { COURSES_LIVE } from "@/shared/lib/features";
import { CONTENT_CATEGORY_LABELS } from "@/shared/lib/labels";
import { categoryHref, shelfHref } from "@/shared/lib/navigation";

import { countLabel, type CatalogueSummary } from "../lib/catalogueSummary";

import {
  ChecklistArt,
  CourseArt,
  DraftingArt,
  FormArt,
  LibraryArt,
  PhoneChatArt,
  Seal,
  ShieldEmblem,
  StampArt,
} from "./illustrations";

/** The page's horizontal frame — every section lines up on it. */
export const FRAME = "mx-auto max-w-shell px-4 sm:px-6 lg:px-8";

const GOLD_BUTTON =
  "inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-3.5 text-sm font-semibold text-on-brand shadow-raised transition-[background-color,transform] hover:-translate-y-0.5 hover:bg-brand-hover motion-reduce:transform-none";

const NAVY_BUTTON =
  "inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-ink-inverse shadow-raised transition-[background-color,transform] hover:-translate-y-0.5 hover:bg-primary-hover motion-reduce:transform-none";

const GHOST_INVERSE_BUTTON =
  "inline-flex items-center gap-2 rounded-xl border border-white/20 px-6 py-3.5 text-sm font-semibold text-ink-inverse transition-colors hover:bg-white/10";

/**
 * A section's heading: a short gold-ruled eyebrow, a serif title, one
 * sentence of why. Centred for sections that stand alone; left-aligned
 * where it sits beside its content.
 */
export function SectionHeading({
  eyebrow,
  title,
  description,
  id,
  align = "left",
  tone = "light",
}: {
  eyebrow: string;
  title: ReactNode;
  description?: string;
  id: string;
  align?: "left" | "center";
  tone?: "light" | "dark";
}) {
  const dark = tone === "dark";
  return (
    <div
      className={
        align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"
      }
    >
      <p
        className={`inline-flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.18em] ${dark ? "text-brand" : "text-gold-ink"}`}
      >
        <span aria-hidden className="h-px w-8 bg-current" />
        {eyebrow}
      </p>
      <h2
        id={id}
        className={`mt-4 font-display text-3xl font-semibold leading-tight tracking-tight sm:text-[2.6rem] sm:leading-[1.12] ${dark ? "text-ink-inverse" : "text-ink"}`}
      >
        {title}
      </h2>
      {description && (
        <p
          className={`mt-4 text-lg leading-relaxed ${dark ? "text-ink-inverse-muted" : "text-ink-muted"}`}
        >
          {description}
        </p>
      )}
    </div>
  );
}

/** "Browse →", with the arrow nudging on hover. */
function MoreLink({
  children,
  tone = "light",
}: {
  children: ReactNode;
  tone?: "light" | "dark";
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-sm font-semibold ${tone === "dark" ? "text-brand" : "text-primary"}`}
    >
      {children}
      <Icon
        icon={ArrowRight}
        size="xs"
        className="transition-transform group-hover:translate-x-1 motion-reduce:transform-none"
      />
    </span>
  );
}

/* ─────────────────────────────────────────────────────────── offerings */

/**
 * What the site offers, as a bento grid: AI drafting leads, because it's
 * the one thing no stationery shop or template site can do; then the ways
 * to get a ready document; then learning and the assistant. Each tile has
 * its own illustration and real counts.
 */
export function Offerings({ summary }: { summary: CatalogueSummary }) {
  const forms = summary.library.FORM.count;
  const checklists = summary.library.CHECKLIST.count;
  const ebooks = summary.library.EBOOK.count;

  return (
    <section aria-labelledby="offerings-title" className={`${FRAME} py-24`}>
      <SectionHeading
        id="offerings-title"
        align="center"
        eyebrow="What you'll find here"
        title="Everything for the paperwork in your life"
        description="Renting a flat, hiring your first employee, going to court — start with the right document, then understand what it means."
      />

      <div className="mt-14 grid gap-5 lg:grid-cols-6">
        {/* AI drafting — the flagship */}
        <Link
          href="/documents/custom"
          className="group relative flex flex-col overflow-hidden rounded-3xl bg-hero-navy p-8 text-ink-inverse shadow-overlay transition-transform hover:-translate-y-1 motion-reduce:transform-none sm:p-10 lg:col-span-4"
        >
          <div className="relative z-10 max-w-sm">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-on-brand">
              <Icon icon={Sparkles} size="xs" /> New
            </span>
            <h3 className="mt-5 font-display text-3xl font-semibold leading-tight text-ink-inverse">
              Any document, drafted by AI
            </h3>
            <p className="mt-3 text-base leading-relaxed text-ink-inverse-muted">
              Describe what you need in your own words. The AI drafts it in the
              format of our advocate-written documents, and an advocate reviews
              it before you download.
            </p>
            <div className="mt-8">
              <MoreLink tone="dark">Draft my document</MoreLink>
            </div>
          </div>
          <DraftingArt className="pointer-events-none absolute -bottom-6 -right-6 w-[58%] max-w-[22rem] opacity-90 transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transform-none sm:-right-2" />
        </Link>

        {/* Templates */}
        <OfferingTile
          href="/documents"
          className="lg:col-span-2"
          title="Ready templates"
          badge={
            summary.templates.count > 0
              ? `${countLabel(summary.templates.count)} templates`
              : undefined
          }
          body="Answer a few questions — on a form or by chat — and get a finished Word and PDF."
          cta="Create a document"
          art={<FormArt className="h-36 w-auto" />}
        />

        {forms > 0 && (
          <OfferingTile
            href={shelfHref("FORM")}
            className="lg:col-span-2"
            title="Legal forms"
            badge={`${countLabel(forms)} forms`}
            body="Affidavits, notices, agreements and court formats, ready to fill in."
            cta="Browse forms"
            art={<StampArt className="h-36 w-auto" />}
          />
        )}
        {checklists > 0 && (
          <OfferingTile
            href={shelfHref("CHECKLIST")}
            className="lg:col-span-2"
            title="Checklists"
            badge={`${countLabel(checklists)} checklists`}
            body="What to check before you sign, file or register — so nothing is missed."
            cta="Browse checklists"
            art={<ChecklistArt className="h-36 w-auto" />}
          />
        )}
        {ebooks > 0 && (
          <OfferingTile
            href={shelfHref("EBOOK")}
            className="lg:col-span-2"
            title="E-books"
            badge={`${countLabel(ebooks)} e-books`}
            body="Plain-language handbooks on property, business, courts and careers."
            cta="Browse e-books"
            art={<LibraryArt className="h-36 w-auto" />}
          />
        )}

        <OfferingTile
          href="/courses"
          className="lg:col-span-3"
          title="Certificate courses"
          badge={
            COURSES_LIVE
              ? `${countLabel(summary.courses.count)} courses`
              : "Coming soon"
          }
          body="Short video courses on GST, property and running a business — with a certificate anyone can verify."
          cta={COURSES_LIVE ? "Explore courses" : "See what's coming"}
          art={<CourseArt className="h-36 w-auto" />}
          horizontal
        />

        <Link
          href="/assistant"
          className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-brand-border bg-brand-subtle p-8 transition-transform hover:-translate-y-1 motion-reduce:transform-none lg:col-span-3"
        >
          <div className="max-w-xs">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-brand">
              <Icon icon={MessageCircle} size="md" />
            </span>
            <h3 className="mt-5 font-display text-2xl font-semibold text-ink">
              Not sure what you need?
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              Describe your situation to the AI assistant, in English or Hindi.
              It points you to the right document, form or course.
            </p>
          </div>
          <div className="mt-6">
            <MoreLink>Ask the assistant</MoreLink>
          </div>
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-8 right-6 hidden w-52 space-y-2 sm:block"
          >
            <p className="ml-auto w-fit rounded-2xl rounded-br-sm bg-brand px-3 py-2 text-xs font-medium text-on-brand shadow-raised">
              My tenant hasn&apos;t paid rent
            </p>
            <p className="w-fit rounded-2xl rounded-bl-sm bg-surface px-3 py-2 text-xs text-ink shadow-raised">
              A legal notice for unpaid rent fits…
            </p>
          </div>
        </Link>
      </div>
    </section>
  );
}

function OfferingTile({
  href,
  className = "",
  title,
  badge,
  body,
  cta,
  art,
  horizontal = false,
}: {
  href: string;
  className?: string;
  title: string;
  badge?: string;
  body: string;
  cta: string;
  art: ReactNode;
  horizontal?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group flex overflow-hidden rounded-3xl border border-line bg-surface shadow-card transition-[transform,box-shadow] hover:-translate-y-1 hover:shadow-overlay motion-reduce:transform-none ${horizontal ? "flex-col sm:flex-row sm:items-center" : "flex-col"} ${className}`}
    >
      <div
        className={`grid place-items-center bg-gradient-to-br from-navy-50 to-surface ${horizontal ? "px-6 pt-6 sm:order-last sm:w-2/5 sm:self-stretch sm:p-6" : "px-6 pt-6"}`}
      >
        <div className="transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none">
          {art}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-7">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-xl font-semibold text-ink">
            {title}
          </h3>
          {badge && (
            <span className="shrink-0 rounded-full bg-brand-subtle px-2.5 py-1 text-xs font-semibold tabular-nums text-gold-ink">
              {badge}
            </span>
          )}
        </div>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">{body}</p>
        <div className="mt-auto pt-5">
          <MoreLink>{cta}</MoreLink>
        </div>
      </div>
    </Link>
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
      className="relative overflow-hidden bg-canvas"
    >
      {/* A fine dotted ground, so the section reads as its own room. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(theme(colors.navy.200)_1px,transparent_1px)] [background-size:22px_22px] opacity-50 [mask-image:linear-gradient(to_bottom,black,transparent)]"
      />
      <div className={`${FRAME} relative py-24`}>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            id="categories-title"
            eyebrow="Browse by topic"
            title="Find it by the area of law"
            description="Every form, checklist and e-book is filed under the part of life it's for."
          />
          <Link
            href="/content-library"
            className="group rounded-xl border border-line-strong bg-surface px-5 py-3 text-sm font-semibold text-ink shadow-card hover:border-primary"
          >
            <MoreLink>Browse the whole library</MoreLink>
          </Link>
        </div>

        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-6">
          {summary.categories.map((entry, index) => (
            <li
              key={entry.category}
              className={index < 3 ? "lg:col-span-2" : "lg:col-span-3"}
            >
              <Link
                href={categoryHref(entry.category)}
                className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-surface p-7 shadow-card transition-[transform,box-shadow,border-color] hover:-translate-y-1 hover:border-brand-border hover:shadow-overlay motion-reduce:transform-none"
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[radial-gradient(closest-side,rgb(212_175_55/0.18),transparent)] transition-transform duration-500 group-hover:scale-125"
                />
                <div className="relative flex items-start justify-between gap-4">
                  <span className="grid h-14 w-14 place-items-center rounded-2xl bg-hero-navy text-brand shadow-raised ring-4 ring-brand-subtle">
                    <Icon icon={CATEGORY_ICONS[entry.category]} size="lg" />
                  </span>
                  <span className="text-right">
                    <span className="block font-display text-3xl font-semibold tabular-nums text-ink">
                      {entry.count}
                    </span>
                    <span className="block text-xs text-ink-subtle">items</span>
                  </span>
                </div>
                <h3 className="relative mt-6 text-lg font-semibold text-ink">
                  {CONTENT_CATEGORY_LABELS[entry.category]}
                </h3>
                <p className="relative mt-1 text-sm text-ink-muted">
                  {CATEGORY_BLURBS[entry.category]}
                </p>
                {entry.examples.length > 0 && (
                  <ul className="relative mt-5 space-y-1.5 border-t border-line pt-4 text-sm text-ink">
                    {entry.examples.slice(0, 2).map((example) => (
                      <li key={example} className="flex gap-2">
                        <Icon
                          icon={FileText}
                          size="xs"
                          className="mt-1 shrink-0 text-ink-subtle"
                        />
                        <span className="min-w-0 truncate">{example}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="relative mt-auto pt-5">
                  <MoreLink>Explore</MoreLink>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────── AI drafting showcase */

const DRAFT_STEPS = [
  {
    title: "Describe it",
    body: "Say what you need and the details — parties, amounts, dates — in your own words.",
  },
  {
    title: "AI drafts it",
    body: "In about a minute, in the format of our advocate-written documents. Preview it free and ask for changes.",
  },
  {
    title: "An advocate reviews it",
    body: "A practising advocate checks and corrects your draft. You're notified the moment it's done.",
  },
  {
    title: "Download and sign",
    body: "Word and PDF, ready to print — and in your account whenever you need it again.",
  },
];

/**
 * The flagship, explained: AI drafting with an advocate in the loop. The
 * picture shows the journey from a customer's own sentence to a sealed
 * document, in the same pieces the product uses.
 */
export function DraftingShowcase() {
  return (
    <section
      aria-labelledby="drafting-title"
      className="relative overflow-hidden bg-surface"
    >
      <div className={`${FRAME} grid items-center gap-16 py-24 lg:grid-cols-2`}>
        <div>
          <SectionHeading
            id="drafting-title"
            eyebrow="AI drafting"
            title={
              <>
                Your words in. A reviewed legal document{" "}
                <span className="text-gold-ink">out.</span>
              </>
            }
            description="Can't find a template? Describe the document you need. Our AI drafts it, and an advocate makes sure it's right."
          />
          <ol className="relative mt-10 space-y-7">
            <span
              aria-hidden
              className="absolute bottom-3 left-[1.15rem] top-3 w-px bg-gradient-to-b from-brand via-brand-border to-transparent"
            />
            {DRAFT_STEPS.map((step, index) => (
              <li key={step.title} className="relative flex gap-5">
                <span className="relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary font-display text-sm font-semibold text-brand ring-4 ring-surface">
                  {index + 1}
                </span>
                <div>
                  <h3 className="text-base font-semibold text-ink">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/documents/custom" className={NAVY_BUTTON}>
              Draft my document
              <Icon icon={ArrowRight} />
            </Link>
            <Link
              href="/documents"
              className="inline-flex items-center gap-2 rounded-xl border border-line-strong px-6 py-3.5 text-sm font-semibold text-ink transition-colors hover:bg-surface-sunken"
            >
              Or use a template
            </Link>
          </div>
        </div>

        {/* The journey, pictured */}
        <div
          aria-hidden
          className="relative mx-auto w-full max-w-md select-none"
        >
          <div className="absolute inset-0 -z-10 rounded-[2.5rem] bg-gradient-to-br from-gold-50 via-surface to-navy-50" />
          <div className="space-y-5 p-6 sm:p-10">
            <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-primary p-4 text-sm leading-relaxed text-ink-inverse shadow-overlay">
              &ldquo;Partnership deed for my bakery with my cousin in Pune.
              60:40 profit share, ₹5 lakh capital, either can exit with 3
              months&apos; notice.&rdquo;
            </div>
            <div className="relative rounded-2xl bg-surface p-6 shadow-overlay ring-1 ring-line">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-gold-ink">
                Draft ready
              </p>
              <p className="mt-1 font-display text-xl font-semibold text-ink">
                Partnership Deed
              </p>
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary-subtle px-2.5 py-1 text-xs font-medium text-primary">
                <Icon icon={BadgeCheck} size="xs" />
                In the format of our advocate-written deed
              </p>
              <div className="mt-5 space-y-2">
                {["w-full", "w-11/12", "w-10/12", "w-full", "w-8/12"].map(
                  (w, i) => (
                    <div
                      key={w + i}
                      className={`h-2 ${w} rounded-full bg-navy-100`}
                    />
                  ),
                )}
              </div>
              <Seal className="absolute -bottom-8 -right-6 h-24 w-24 rotate-12 drop-shadow-xl" />
            </div>
            <div className="flex max-w-[80%] items-center gap-3 rounded-2xl bg-surface p-4 shadow-overlay ring-1 ring-line">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-success-subtle text-success-text">
                <Icon icon={UserCheck} size="md" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-ink">
                  Reviewed by an advocate
                </span>
                <span className="block text-xs text-ink-muted">
                  Ready to download · Word + PDF
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────── assistant banner */

const EXAMPLE_QUESTIONS = [
  "My landlord wants an 11-month agreement",
  "How do I register a will?",
  "I'm hiring my first employee",
];

/**
 * The AI assistant: for the visitor who doesn't know the name of the
 * document they need — which is most first-time visitors.
 */
export function AssistantBanner() {
  return (
    <section aria-labelledby="assistant-title" className={`${FRAME} py-24`}>
      <div className="relative overflow-hidden rounded-[2rem] bg-hero-navy px-6 py-14 shadow-overlay sm:px-14 lg:py-0">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 bottom-0 h-96 w-96 rounded-full bg-[radial-gradient(closest-side,rgb(212_175_55/0.14),transparent)]"
        />
        <div className="relative grid items-center gap-12 lg:grid-cols-[1.15fr_1fr]">
          <div className="lg:py-16">
            <SectionHeading
              id="assistant-title"
              tone="dark"
              eyebrow="AI assistant"
              title="Not sure which document you need? Just ask."
              description="Describe your situation in English or Hindi. The assistant searches everything on the site and points you to the right document, form, e-book or course."
            />
            <ul className="mt-8 flex flex-wrap gap-2">
              {EXAMPLE_QUESTIONS.map((question) => (
                <li key={question}>
                  <Link
                    href={`/assistant?q=${encodeURIComponent(question)}`}
                    className="inline-flex rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-ink-inverse transition-colors hover:border-brand/60 hover:bg-white/10"
                  >
                    &ldquo;{question}&rdquo;
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href="/assistant" className={GOLD_BUTTON}>
                Ask the assistant
                <Icon icon={MessageCircle} />
              </Link>
              <p className="max-w-xs text-xs text-ink-inverse-muted">
                It explains and recommends; it doesn&apos;t give legal advice on
                your case.
              </p>
            </div>
          </div>
          <div className="relative mx-auto hidden h-full w-full max-w-xs items-end sm:flex lg:max-w-sm">
            <PhoneChatArt className="w-full translate-y-10 drop-shadow-2xl lg:translate-y-16" />
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
    body: "Answer plain questions, or download a form to complete yourself.",
    icon: FileText,
  },
  {
    title: "Pay once, securely",
    body: "One price with GST shown, through Razorpay. A GST invoice with every order.",
    icon: IndianRupee,
  },
  {
    title: "Download — or get it reviewed",
    body: "Word and PDF, ready to sign. Add an advocate's review for a second pair of eyes.",
    icon: UserCheck,
  },
];

export function HowItWorks() {
  return (
    <section
      aria-labelledby="how-title"
      className="border-y border-line bg-canvas"
    >
      <div className={`${FRAME} py-24`}>
        <SectionHeading
          id="how-title"
          align="center"
          eyebrow="How it works"
          title="From question to signed paper in four steps"
          description="No appointments, no jargon — and you only pay for what you take."
        />
        <ol className="relative mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          <span
            aria-hidden
            className="absolute left-[12%] right-[12%] top-8 hidden h-px border-t-2 border-dashed border-brand-border lg:block"
          />
          {STEPS.map((step, index) => (
            <li key={step.title} className="relative text-center">
              <span className="relative mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-surface text-primary shadow-overlay ring-1 ring-line">
                <Icon icon={step.icon} size="lg" />
                <span className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-brand text-xs font-bold text-on-brand">
                  {index + 1}
                </span>
              </span>
              <h3 className="mt-6 text-lg font-semibold text-ink">
                {step.title}
              </h3>
              <p className="mx-auto mt-2 max-w-[16rem] text-sm leading-relaxed text-ink-muted">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
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
    title: "Advocate review",
    body: "Every AI draft — and any document you choose — is checked by a practising advocate.",
    icon: UserCheck,
  },
  {
    title: "Reviewed before publishing",
    body: "Templates and forms come from our advocate-written library and pass review first.",
    icon: ShieldCheck,
  },
  {
    title: "Secure payments",
    body: "Paid through Razorpay. Your card details never reach our servers.",
    icon: Lock,
  },
  {
    title: "GST invoice, every time",
    body: "One price with tax shown — no subscription, no recurring charge.",
    icon: Receipt,
  },
  {
    title: "Private to your account",
    body: "Your answers and documents stay yours, behind download links that expire. Delete your account any time.",
    icon: KeyRound,
  },
  {
    title: "Certificates you can check",
    body: "Each certificate carries a code anyone can verify here, no account needed.",
    icon: BadgeCheck,
  },
];

export function Assurances() {
  return (
    <section aria-labelledby="trust-title" className={`${FRAME} py-24`}>
      <div className="grid items-center gap-14 lg:grid-cols-[0.9fr_1.4fr]">
        <div>
          <SectionHeading
            id="trust-title"
            eyebrow="Why Pratikar"
            title="Built for documents you'll actually sign"
            description="Legal paperwork has to be right. Here is what we do to make sure it is."
          />
          <ShieldEmblem className="mt-10 hidden w-72 lg:block" />
        </div>
        <ul className="grid gap-5 sm:grid-cols-2">
          {ASSURANCES.map((item) => (
            <li
              key={item.title}
              className="rounded-2xl border border-line bg-surface p-6 shadow-card transition-shadow hover:shadow-raised"
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-subtle text-gold-ink">
                <Icon icon={item.icon} size="md" />
              </span>
              <h3 className="mt-4 text-base font-semibold text-ink">
                {item.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                {item.body}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────────────────────── FAQ teaser */

export interface FaqPreviewItem {
  id: string;
  question: string;
  answer: string;
}

/**
 * A few answers from the FAQ, for the questions that stop people buying.
 * Server-rendered <details>, so it works without JavaScript. Left out
 * entirely until the client has published FAQ entries.
 */
export function FaqTeaser({ items }: { items: FaqPreviewItem[] }) {
  if (items.length === 0) return null;
  return (
    <section
      aria-labelledby="faq-title"
      className="border-t border-line bg-canvas"
    >
      <div className={`${FRAME} grid gap-12 py-24 lg:grid-cols-[0.8fr_1.2fr]`}>
        <div>
          <SectionHeading
            id="faq-title"
            eyebrow="Questions"
            title="Good to know"
            description="Quick answers about downloads, payments and reviews."
          />
          <Link href="/faq" className="group mt-8 inline-block">
            <MoreLink>All questions</MoreLink>
          </Link>
        </div>
        <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
          {items.map((item) => (
            <details key={item.id} className="group/faq">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 text-base font-semibold text-ink hover:bg-surface-sunken [&::-webkit-details-marker]:hidden">
                {item.question}
                <span
                  aria-hidden
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary-subtle text-primary transition-transform group-open/faq:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="whitespace-pre-line px-6 pb-5 text-sm leading-relaxed text-ink-muted">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────── closing band */

export function ClosingBanner() {
  return (
    <section aria-labelledby="closing-title" className={`${FRAME} pb-24`}>
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-gold-300 via-brand to-gold-600 px-6 py-14 shadow-overlay sm:px-14">
        {/* The logo's columns, large and faint, as a watermark */}
        <svg
          aria-hidden
          viewBox="0 0 300 380"
          className="pointer-events-none absolute -right-6 -top-10 h-[150%] text-navy-900/10"
          fill="currentColor"
        >
          <path d="M2 3H192A108 113 0 0 1 192 229H178V196H192A75 80 0 0 0 192 36H24Z" />
          <path d="M22 58H190Q188 80 168 80H44Q24 80 22 58Z" />
          <rect x="46" y="100" width="114" height="19" />
          <path d="M57 125H76V359L57 377Z" />
          <path d="M94 125H112V320L94 338Z" />
          <path d="M130 125H148V282L130 300Z" />
        </svg>
        <div className="relative flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <h2
              id="closing-title"
              className="font-display text-3xl font-semibold leading-tight text-navy-900 sm:text-[2.6rem] sm:leading-[1.1]"
            >
              Start with the document you need today.
            </h2>
            <p className="mt-3 text-lg text-navy-800">
              Browse everything freely — sign in only when you&apos;re ready to
              make or buy something.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Link href="/documents/custom" className={NAVY_BUTTON}>
              Draft with AI
              <Icon icon={Sparkles} />
            </Link>
            <Link
              href="/documents"
              className="inline-flex items-center gap-2 rounded-xl border border-navy-900/25 px-6 py-3.5 text-sm font-semibold text-navy-900 transition-colors hover:bg-navy-900/5"
            >
              Browse templates
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export { GHOST_INVERSE_BUTTON, GOLD_BUTTON };
