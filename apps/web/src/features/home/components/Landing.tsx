import type { ContentCategory } from "@pratikar/types";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Briefcase,
  House,
  KeyRound,
  Laptop,
  ListChecks,
  Lock,
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
import { Reveal } from "@/shared/components/Reveal";
import { COURSES_LIVE } from "@/shared/lib/features";
import { CONTENT_CATEGORY_LABELS } from "@/shared/lib/labels";
import { categoryHref, shelfHref } from "@/shared/lib/navigation";

import { countLabel, type CatalogueSummary } from "../lib/catalogueSummary";

import { CertificateArt, Seal } from "./illustrations";

/** The page's horizontal frame — every section lines up on it. */
export const FRAME = "mx-auto max-w-shell px-4 sm:px-6 lg:px-8";

const ROMAN = ["I", "II", "III", "IV", "V", "VI"];

/**
 * A section's opening: its number in italic gold, a small-capital label on a
 * hairline, and a large light serif title. Numbering the sections is what
 * makes a long page read as one considered document rather than a stack of
 * blocks.
 */
export function SectionHead({
  index,
  eyebrow,
  title,
  intro,
  id,
  tone = "light",
  align = "left",
  aside,
}: {
  index: string;
  eyebrow: string;
  title: ReactNode;
  intro?: string;
  id: string;
  tone?: "light" | "dark";
  align?: "left" | "center";
  /** Something for the far side — usually a "view all" link. */
  aside?: ReactNode;
}) {
  const dark = tone === "dark";
  return (
    <Reveal
      className={`flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between ${
        align === "center"
          ? "items-center text-center lg:flex-col lg:items-center"
          : ""
      }`}
    >
      <div className={align === "center" ? "max-w-3xl" : "max-w-3xl"}>
        <p
          className={`flex items-center gap-4 ${align === "center" ? "justify-center" : ""}`}
        >
          <span className="font-display text-lg italic text-brand">
            {index}
          </span>
          <span
            aria-hidden
            className={`h-px w-10 ${dark ? "bg-ivory/25" : "bg-noir/20"}`}
          />
          <span
            className={`text-[0.65rem] font-semibold uppercase tracking-[0.28em] ${dark ? "text-ivory/60" : "text-noir/55"}`}
          >
            {eyebrow}
          </span>
        </p>
        <h2
          id={id}
          className={`mt-6 text-4xl font-light leading-[1.04] sm:text-6xl ${dark ? "text-ivory" : "text-noir"}`}
        >
          {title}
        </h2>
        {intro && (
          <p
            className={`mt-6 max-w-2xl text-lg leading-relaxed ${align === "center" ? "mx-auto" : ""} ${dark ? "text-ivory/65" : "text-noir/65"}`}
          >
            {intro}
          </p>
        )}
      </div>
      {aside}
    </Reveal>
  );
}

/** "View all →" for the far side of a section head. */
function AsideLink({
  href,
  children,
  tone = "light",
}: {
  href: string;
  children: ReactNode;
  tone?: "light" | "dark";
}) {
  return (
    <Link
      href={href}
      className={`group inline-flex shrink-0 items-center gap-3 text-[0.7rem] font-semibold uppercase tracking-[0.22em] ${tone === "dark" ? "text-ivory" : "text-noir"}`}
    >
      <span className="link-draw">{children}</span>
      <span
        className={`grid h-10 w-10 place-items-center rounded-full border transition-colors ${
          tone === "dark"
            ? "border-ivory/25 group-hover:border-brand group-hover:bg-brand group-hover:text-noir"
            : "border-noir/20 group-hover:border-noir group-hover:bg-noir group-hover:text-ivory"
        }`}
      >
        <Icon icon={ArrowRight} size="xs" />
      </span>
    </Link>
  );
}

/* ─────────────────────────────────────────────────────── title marquee */

/** A small four-point star, the marquee's separator. */
function Star() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 12 12"
      className="h-3 w-3 shrink-0 text-brand"
      fill="currentColor"
    >
      <path d="M6 0c.4 3.2 2.8 5.6 6 6-3.2.4-5.6 2.8-6 6-.4-3.2-2.8-5.6-6-6 3.2-.4 5.6-2.8 6-6Z" />
    </svg>
  );
}

/**
 * The library's real titles, sliding past in the display italic — what the
 * platform is built on, said by showing it. There are no client logos to
 * parade yet, and this is better than inventing any.
 */
export function TitleMarquee({ summary }: { summary: CatalogueSummary }) {
  const library =
    summary.library.FORM.count +
    summary.library.CHECKLIST.count +
    summary.library.EBOOK.count;
  const titles = [
    ...summary.templates.examples,
    ...summary.categories.flatMap((entry) => entry.examples),
  ];
  if (library === 0 || titles.length < 4) return null;

  return (
    <section
      aria-label="What the library holds"
      className="border-b border-ivory-line bg-ivory py-10"
    >
      <p className="px-4 text-center text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-noir/55">
        {countLabel(library)} documents, written by practising advocates
      </p>
      <div className="relative mt-7 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
        <ul className="flex w-max items-center gap-10 hover:[animation-play-state:paused] motion-safe:animate-marquee-slow">
          {[...titles, ...titles].map((title, index) => (
            <li
              key={`${title}-${index}`}
              aria-hidden={index >= titles.length || undefined}
              className="flex shrink-0 items-center gap-10"
            >
              <span className="font-display text-2xl font-light italic text-noir sm:text-3xl">
                {title}
              </span>
              <Star />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────── the practice */

/**
 * Everything the site does, as an index — one ruled line each, the way a
 * luxury house lists its services. Hovering a line turns it to noir; the
 * count on the right is live.
 */
export function PracticeIndex({ summary }: { summary: CatalogueSummary }) {
  const rows: {
    href: string;
    title: string;
    body: string;
    count?: string;
    tag?: string;
  }[] = [
    {
      href: "/documents/custom",
      title: "AI Drafting",
      body: "Any document from your own words, reviewed by an advocate.",
      tag: "New",
    },
    {
      href: "/documents",
      title: "Ready Templates",
      body: "Answer a few questions; receive the finished Word and PDF.",
      count: summary.templates.count
        ? `${countLabel(summary.templates.count)} templates`
        : undefined,
    },
    {
      href: shelfHref("FORM"),
      title: "Legal Forms",
      body: "Affidavits, notices, agreements and court formats.",
      count: summary.library.FORM.count
        ? `${countLabel(summary.library.FORM.count)} forms`
        : undefined,
    },
    {
      href: "/content-library",
      title: "Checklists & E\u2011books",
      body: "What to check before you sign — and why it matters.",
      count:
        summary.library.CHECKLIST.count + summary.library.EBOOK.count
          ? `${countLabel(summary.library.CHECKLIST.count + summary.library.EBOOK.count)} guides`
          : undefined,
    },
    {
      href: "/courses",
      title: "Certificate Courses",
      body: "Short video courses ending in a certificate anyone can verify.",
      tag: COURSES_LIVE ? undefined : "Soon",
    },
  ];

  return (
    <section aria-labelledby="practice-title" className="bg-ivory">
      <div className={`${FRAME} py-28 sm:py-36`}>
        <SectionHead
          index="01"
          eyebrow="The practice"
          id="practice-title"
          title={
            <>
              Everything for the paperwork{" "}
              <span className="accent-serif">in your life.</span>
            </>
          }
          intro="Renting a flat, hiring your first employee, going to court — begin with the right document, then understand what it means."
        />

        <ol className="mt-20 border-t border-noir/15">
          {rows.map((row, index) => (
            <Reveal as="li" key={row.title} delay={index * 60}>
              <Link
                href={row.href}
                className="group relative grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-x-4 border-b border-noir/15 py-8 transition-colors duration-500 hover:bg-noir sm:grid-cols-[4rem_minmax(0,1.1fr)_minmax(0,1fr)_3rem] sm:gap-x-8 sm:px-4 lg:grid-cols-[4rem_minmax(0,1.1fr)_minmax(0,1fr)_14rem] lg:py-10"
              >
                <span className="font-display text-sm italic text-gold-ink transition-colors group-hover:text-brand">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="flex items-baseline gap-3">
                  <span className="font-display text-3xl font-light text-noir transition-colors group-hover:text-ivory sm:text-5xl">
                    {row.title}
                  </span>
                  {row.tag && (
                    <span className="border border-brand px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-gold-ink group-hover:text-brand">
                      {row.tag}
                    </span>
                  )}
                </span>
                <span className="col-start-2 mt-2 text-sm leading-relaxed text-noir/60 transition-colors group-hover:text-ivory/65 sm:col-start-3 sm:mt-0 sm:text-base">
                  {row.body}
                  {row.count && (
                    <span className="mt-1 block text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-noir/40 group-hover:text-brand sm:hidden">
                      {row.count}
                    </span>
                  )}
                </span>
                <span className="col-start-3 row-span-2 row-start-1 flex items-center justify-end gap-6 sm:col-start-4 sm:row-span-1">
                  {row.count && (
                    <span className="hidden text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-noir/45 transition-colors group-hover:text-brand lg:inline">
                      {row.count}
                    </span>
                  )}
                  <span className="grid h-12 w-12 place-items-center rounded-full border border-noir/20 text-noir transition-[transform,border-color,color,background-color] duration-500 group-hover:rotate-45 group-hover:border-brand group-hover:bg-brand group-hover:text-noir">
                    <Icon icon={ArrowUpRight} size="sm" />
                  </span>
                </span>
              </Link>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────── the signature service */

const DRAFT_STEPS = [
  {
    title: "Describe it",
    body: "Parties, amounts, dates — in your own words, in English or Hindi.",
  },
  {
    title: "AI drafts it",
    body: "In about a minute, modelled on our advocate-written documents. Preview free; ask for changes.",
  },
  {
    title: "An advocate reviews it",
    body: "A practising advocate checks and corrects every clause.",
  },
  {
    title: "You sign it",
    body: "Word and PDF, notified by email, SMS and push the moment it's ready.",
  },
];

/**
 * The flagship, given the page's one full noir band: AI drafting with an
 * advocate in the loop. A customer's own sentence on the left becomes a
 * sealed deed on the right; the four steps run beneath on a gold line.
 */
export function SignatureDrafting() {
  return (
    <section
      aria-labelledby="signature-title"
      data-surface="inverse"
      className="relative overflow-hidden bg-noir-glow text-ivory"
    >
      <div className={`${FRAME} py-28 sm:py-36`}>
        <SectionHead
          index="02"
          tone="dark"
          eyebrow="The signature service"
          id="signature-title"
          title={
            <>
              Your words in.{" "}
              <em className="foil-text font-light italic">
                A reviewed document out.
              </em>
            </>
          }
          intro="When no template fits, describe the document you need. Our AI drafts it in the form of our advocate-written precedents — and a practising advocate makes certain it's right."
          aside={
            <Link href="/documents/custom" className="btn-gold">
              Draft my document
              <Icon icon={ArrowRight} size="xs" />
            </Link>
          }
        />

        {/* The transformation */}
        <Reveal className="mt-20 grid grid-cols-[minmax(0,1fr)] items-center gap-10 lg:grid-cols-[1fr_auto_1fr]">
          <figure className="border border-noir-line bg-white/[0.03] p-8 backdrop-blur sm:p-10">
            <figcaption className="text-[0.6rem] font-semibold uppercase tracking-[0.28em] text-ivory/45">
              What you write
            </figcaption>
            <blockquote className="mt-6 font-display text-2xl font-light italic leading-snug text-ivory sm:text-3xl">
              &ldquo;A partnership deed for my bakery with my cousin in Pune —
              sixty–forty profit share, five lakh capital, three months&apos;
              notice to exit.&rdquo;
            </blockquote>
          </figure>

          <div aria-hidden className="flex justify-center">
            <span className="grid h-16 w-16 rotate-90 place-items-center rounded-full border border-brand/50 text-brand lg:rotate-0">
              <Icon icon={ArrowRight} size="md" />
            </span>
          </div>

          <figure
            aria-hidden
            className="relative bg-ivory p-8 text-noir shadow-[0_40px_90px_-30px_rgb(0_0_0/0.9)] sm:p-10"
          >
            <div className="h-0.5 w-10 bg-gold-foil" />
            <p className="mt-5 text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-gold-ink">
              What you receive
            </p>
            <p className="mt-2 font-display text-3xl font-normal">
              Partnership <span className="italic">Deed</span>
            </p>
            <div className="mt-6 space-y-2.5">
              {["w-full", "w-11/12", "w-10/12", "w-full", "w-8/12"].map(
                (width, index) => (
                  <div key={index} className={`h-[3px] ${width} bg-noir/10`} />
                ),
              )}
            </div>
            <p className="mt-6 inline-flex items-center gap-2 text-xs font-semibold text-noir/70">
              <Icon icon={BadgeCheck} size="xs" className="text-gold-ink" />
              Reviewed by a practising advocate
            </p>
            <Seal className="absolute -bottom-10 -right-6 h-28 w-28 rotate-12 drop-shadow-[0_14px_24px_rgb(0_0_0/0.5)]" />
          </figure>
        </Reveal>

        {/* The four steps on a gold line */}
        <ol className="relative mt-24 grid gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <span
            aria-hidden
            className="absolute left-0 right-0 top-[1.1rem] hidden h-px bg-gold-foil opacity-50 lg:block"
          />
          {DRAFT_STEPS.map((step, index) => (
            <Reveal
              as="li"
              key={step.title}
              delay={index * 90}
              className="relative"
            >
              <span className="relative grid h-9 w-9 place-items-center rounded-full border border-brand bg-noir font-display text-sm italic text-brand">
                {ROMAN[index]}
              </span>
              <h3 className="mt-6 font-display text-2xl font-light text-ivory">
                {step.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-ivory/60">
                {step.body}
              </p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────── areas of law */

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

/**
 * The library by area of law, as an editorial grid: the largest area leads
 * on noir, the rest sit on ivory, each with its live count set large.
 */
export function AreasOfLaw({ summary }: { summary: CatalogueSummary }) {
  if (summary.categories.length === 0) return null;
  const areas = [...summary.categories].sort((a, b) => b.count - a.count);

  return (
    <section aria-labelledby="areas-title" className="bg-ivory-deep">
      <div className={`${FRAME} py-28 sm:py-36`}>
        <SectionHead
          index="04"
          eyebrow="Areas of law"
          id="areas-title"
          title={
            <>
              Find it by the part of life{" "}
              <span className="accent-serif">it&apos;s for.</span>
            </>
          }
          aside={
            <AsideLink href="/content-library">The whole library</AsideLink>
          }
        />

        <ul className="mt-16 grid grid-cols-[minmax(0,1fr)] gap-px overflow-hidden border border-noir/10 bg-noir/10 sm:grid-cols-2 lg:grid-cols-3">
          {areas.map((entry, index) => {
            const lead = index === 0;
            return (
              <Reveal
                as="li"
                key={entry.category}
                delay={index * 70}
                className={lead ? "lg:row-span-2" : ""}
              >
                <Link
                  href={categoryHref(entry.category)}
                  data-surface={lead ? "inverse" : undefined}
                  className={`group flex h-full min-h-[17rem] flex-col p-8 transition-colors duration-500 sm:p-10 ${
                    lead
                      ? "bg-noir-glow text-ivory"
                      : "bg-ivory text-noir hover:bg-noir hover:text-ivory"
                  }`}
                >
                  <div className="flex items-start justify-between gap-6">
                    <Icon
                      icon={CATEGORY_ICONS[entry.category]}
                      size="lg"
                      className="text-gold-ink group-hover:text-brand"
                    />
                    <span
                      className={`font-display font-light tabular-nums ${lead ? "text-8xl text-brand" : "text-6xl"}`}
                    >
                      {entry.count}
                    </span>
                  </div>
                  <h3
                    className={`mt-auto pt-10 font-display font-light ${lead ? "text-4xl text-ivory sm:text-5xl" : "text-3xl text-noir group-hover:text-ivory"}`}
                  >
                    {CONTENT_CATEGORY_LABELS[entry.category]}
                  </h3>
                  <p className="mt-2 text-sm opacity-65">
                    {CATEGORY_BLURBS[entry.category]}
                  </p>
                  {lead && entry.examples.length > 0 && (
                    <ul className="mt-8 space-y-2 border-t border-noir-line pt-6 text-sm text-ivory/75">
                      {entry.examples.map((example) => (
                        <li key={example} className="font-display italic">
                          {example}
                        </li>
                      ))}
                    </ul>
                  )}
                  <span className="mt-6 inline-flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.24em] opacity-70 transition-opacity group-hover:opacity-100">
                    Explore
                    <Icon
                      icon={ArrowRight}
                      size="xs"
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </span>
                </Link>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────── the assistant */

const QUESTIONS = [
  "My landlord wants an 11-month agreement",
  "How do I register a will?",
  "I'm hiring my first employee",
];

/**
 * The assistant, for the visitor who doesn't know the name of the document
 * they need — most first-time visitors. A conversation shown as it happens,
 * with the answer leading to real documents.
 */
export function AssistantFeature() {
  return (
    <section aria-labelledby="assistant-title" className="bg-ivory">
      <div
        className={`${FRAME} grid grid-cols-[minmax(0,1fr)] items-center gap-16 py-28 sm:py-36 lg:grid-cols-2 lg:gap-24`}
      >
        <div>
          <SectionHead
            index="05"
            eyebrow="The assistant"
            id="assistant-title"
            title={
              <>
                Not sure what you need?{" "}
                <span className="accent-serif">Simply ask.</span>
              </>
            }
            intro="Describe your situation in English or Hindi. The assistant reads everything on the site and points you to the right document, form, e-book or course. It explains; it never gives advice on your case."
          />
          <Reveal className="mt-10">
            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.28em] text-noir/50">
              People ask
            </p>
            <ul className="mt-4 divide-y divide-noir/10 border-y border-noir/10">
              {QUESTIONS.map((question) => (
                <li key={question}>
                  <Link
                    href={`/assistant?q=${encodeURIComponent(question)}`}
                    className="group flex items-center justify-between gap-4 py-4"
                  >
                    <span className="font-display text-xl font-light italic text-noir">
                      &ldquo;{question}&rdquo;
                    </span>
                    <Icon
                      icon={ArrowUpRight}
                      className="shrink-0 text-noir/40 transition-colors group-hover:text-gold-ink"
                    />
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/assistant" className="btn-noir mt-10">
              <Icon icon={Sparkles} size="xs" className="text-brand" />
              Ask the assistant
            </Link>
          </Reveal>
        </div>

        {/* The conversation */}
        <Reveal className="relative">
          <div className="absolute -inset-4 -z-10 border border-ivory-line" />
          <div
            aria-hidden
            className="select-none bg-noir p-6 text-ivory shadow-[0_50px_100px_-40px_rgb(6_12_23/0.7)] sm:p-9"
          >
            <div className="flex items-center justify-between border-b border-noir-line pb-5">
              <span className="flex items-center gap-2 text-[0.6rem] font-semibold uppercase tracking-[0.28em] text-ivory/55">
                <Icon icon={Sparkles} size="xs" className="text-brand" />
                Pratikar assistant
              </span>
              <span className="h-2 w-2 rounded-full bg-success" />
            </div>
            <p className="ml-auto mt-7 max-w-[85%] bg-ivory px-5 py-3.5 text-sm leading-relaxed text-noir">
              My tenant hasn&apos;t paid rent for three months. What can I do?
            </p>
            <div className="mt-6 max-w-[92%] space-y-3 text-sm leading-relaxed text-ivory/80">
              <p>
                The usual first step is a written legal notice demanding the
                arrears, with a date to pay by. Keep proof of the agreement and
                of each missed payment.
              </p>
              <p>These will help:</p>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                ["Form", "Legal Notice for Unpaid Rent"],
                ["Template", "Rent Agreement"],
              ].map(([kind, title]) => (
                <div
                  key={title}
                  className="border border-noir-line bg-white/[0.04] p-4"
                >
                  <p className="text-[0.55rem] font-semibold uppercase tracking-[0.26em] text-brand">
                    {kind}
                  </p>
                  <p className="mt-1.5 font-display text-lg leading-snug text-ivory">
                    {title}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────────────────────── prices */

export interface PriceFloor {
  label: string;
  /** Formatted, GST-inclusive. */
  from: string;
  note: string;
  href: string;
}

/**
 * What things cost, before anyone has to ask: the lowest real price of each
 * kind, GST included, read from the catalogue. Kinds with nothing on sale
 * are left out rather than given a made-up number.
 */
export function PriceGuide({ prices }: { prices: PriceFloor[] }) {
  if (prices.length === 0) return null;
  return (
    <section
      aria-labelledby="prices-title"
      className="border-y border-ivory-line bg-ivory"
    >
      <div className={`${FRAME} py-28 sm:py-36`}>
        <SectionHead
          index="08"
          eyebrow="Fees"
          id="prices-title"
          title={
            <>
              One fixed price.{" "}
              <span className="accent-serif">No appointments.</span>
            </>
          }
          intro="GST included, shown before you begin. No subscription and no hourly fees — you pay once, for the document you take."
        />
        <ul
          className={`mt-16 grid grid-cols-[minmax(0,1fr)] gap-px border border-noir/10 bg-noir/10 sm:grid-cols-2 ${
            prices.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"
          }`}
        >
          {prices.map((price, index) => (
            <Reveal as="li" key={price.label} delay={index * 70}>
              <Link
                href={price.href}
                className="group flex h-full flex-col bg-ivory p-8 transition-colors duration-500 hover:bg-noir sm:p-10"
              >
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.26em] text-noir/55 group-hover:text-ivory/55">
                  {price.label}
                </p>
                <p className="mt-8 font-display text-sm italic text-gold-ink group-hover:text-brand">
                  from
                </p>
                <p className="font-display text-6xl font-light tabular-nums text-noir group-hover:text-ivory">
                  {price.from}
                </p>
                <p className="mt-6 text-sm leading-relaxed text-noir/60 group-hover:text-ivory/65">
                  {price.note}
                </p>
              </Link>
            </Reveal>
          ))}
        </ul>
        <p className="mt-6 text-sm text-noir/55">
          Generating and previewing a template is free — you pay only to
          download. An advocate&apos;s review is quoted on the document page.
        </p>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────── standard */

/**
 * What the platform promises, set as articles — numbered, ruled, plain.
 * Only what the product actually does; no invented customer counts,
 * ratings or testimonials until there are real ones.
 */
const STANDARD: { title: string; body: string; icon: LucideIcon }[] = [
  {
    title: "An advocate, in the loop",
    body: "Every AI draft — and any document you choose — is checked by a practising advocate before you download it.",
    icon: UserCheck,
  },
  {
    title: "Written by advocates",
    body: "Templates and forms come from our advocate-written library and pass review before they're published.",
    icon: ShieldCheck,
  },
  {
    title: "Secure payment",
    body: "Paid through Razorpay. Your card details never reach our servers.",
    icon: Lock,
  },
  {
    title: "A GST invoice, every time",
    body: "One price with tax shown — no subscription, no recurring charge.",
    icon: Receipt,
  },
  {
    title: "Private to you",
    body: "Your answers and documents stay yours, behind links that expire. Delete your account whenever you like.",
    icon: KeyRound,
  },
  {
    title: "Certificates that verify",
    body: "Every certificate carries a code anyone can check here, without an account.",
    icon: BadgeCheck,
  },
];

export function TheStandard() {
  return (
    <section
      aria-labelledby="standard-title"
      data-surface="inverse"
      className="bg-noir text-ivory"
    >
      <div className={`${FRAME} py-28 sm:py-36`}>
        <SectionHead
          index="09"
          tone="dark"
          eyebrow="The Pratikar standard"
          id="standard-title"
          title={
            <>
              Legal paperwork has to be{" "}
              <em className="foil-text font-light italic">right.</em>
            </>
          }
          intro="Here is what we do to make certain it is."
        />
        <ol className="mt-20 grid gap-x-12 sm:grid-cols-2 lg:grid-cols-3">
          {STANDARD.map((item, index) => (
            <Reveal
              as="li"
              key={item.title}
              delay={(index % 3) * 80}
              className="border-t border-noir-line py-10"
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-sm italic text-brand">
                  Article {ROMAN[index]}
                </span>
                <Icon icon={item.icon} className="text-ivory/40" />
              </div>
              <h3 className="mt-8 font-display text-2xl font-light text-ivory">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-ivory/60">
                {item.body}
              </p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────────────────── the process */

const PROCESS = [
  {
    title: "Find",
    body: "Search, browse by area of law, or describe your situation to the assistant.",
  },
  {
    title: "Fill",
    body: "Answer plain questions — on a form, or simply by chatting.",
  },
  {
    title: "Pay",
    body: "One price with GST shown, through Razorpay, with a GST invoice.",
  },
  {
    title: "Sign",
    body: "Download Word and PDF — or add an advocate's review first.",
  },
];

export function Process() {
  return (
    <section aria-labelledby="process-title" className="bg-ivory">
      <div className={`${FRAME} py-28 sm:py-36`}>
        <SectionHead
          index="10"
          eyebrow="How it works"
          id="process-title"
          align="center"
          title={
            <>
              From question to signed paper,{" "}
              <span className="accent-serif">in four steps.</span>
            </>
          }
        />
        <ol className="mt-20 grid gap-px border border-noir/10 bg-noir/10 sm:grid-cols-2 lg:grid-cols-4">
          {PROCESS.map((step, index) => (
            <Reveal
              as="li"
              key={step.title}
              delay={index * 80}
              className="bg-ivory p-8 sm:p-10"
            >
              <span className="font-display text-7xl font-light italic text-gold-ink/80">
                {index + 1}
              </span>
              <h3 className="mt-8 font-display text-3xl font-light text-noir">
                <span className="sr-only">Step {index + 1}: </span>
                {step.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-noir/60">
                {step.body}
              </p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────── courses */

/**
 * Courses: the certificate itself as the picture — the thing a learner
 * walks away with. Says "coming soon" plainly until courses are live.
 */
export function CoursesFeature() {
  return (
    <section aria-labelledby="courses-title" className="bg-ivory-deep">
      <div
        className={`${FRAME} grid grid-cols-[minmax(0,1fr)] items-center gap-16 py-28 sm:py-36 lg:grid-cols-2 lg:gap-24`}
      >
        <Reveal className="order-last lg:order-first">
          <CertificateArt className="mx-auto w-full max-w-lg rotate-[-3deg] drop-shadow-[0_40px_60px_rgb(6_12_23/0.25)]" />
        </Reveal>
        <div>
          <SectionHead
            index="07"
            eyebrow={COURSES_LIVE ? "Courses" : "Coming soon · Courses"}
            id="courses-title"
            title={
              <>
                Learn the law you use —{" "}
                <span className="accent-serif">and prove it.</span>
              </>
            }
            intro="Short video courses on GST, property and running a business. Finish one and receive a certificate with a code anyone can check."
          />
          <Reveal className="mt-10 flex flex-wrap gap-3">
            <Link href="/courses" className="btn-noir">
              {COURSES_LIVE ? "Explore courses" : "See what's coming"}
            </Link>
            <Link href="/verify" className="btn-line text-noir">
              Verify a certificate
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────── FAQ */

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
    <section aria-labelledby="faq-title" className="bg-ivory">
      <div
        className={`${FRAME} grid gap-16 border-t border-ivory-line py-28 sm:py-36 lg:grid-cols-[0.8fr_1.2fr]`}
      >
        <SectionHead
          index="11"
          eyebrow="Questions"
          id="faq-title"
          title={
            <>
              Good to <span className="accent-serif">know.</span>
            </>
          }
          aside={<AsideLink href="/faq">All questions</AsideLink>}
        />
        <div className="border-t border-noir/15">
          {items.map((item) => (
            <details
              key={item.id}
              className="group/faq border-b border-noir/15"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-7 font-display text-xl font-light text-noir sm:text-2xl [&::-webkit-details-marker]:hidden">
                {item.question}
                <span
                  aria-hidden
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-noir/20 text-xl font-light transition-transform duration-500 group-open/faq:rotate-45 group-open/faq:border-noir group-open/faq:bg-noir group-open/faq:text-ivory"
                >
                  +
                </span>
              </summary>
              <p className="whitespace-pre-line pb-8 pr-14 text-base leading-relaxed text-noir/65">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────── closing call */

export function ClosingCall() {
  return (
    <section
      aria-labelledby="closing-title"
      data-surface="inverse"
      data-flush-footer
      className="relative overflow-hidden bg-noir-glow text-ivory"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-24 select-none font-display text-[34rem] font-light leading-none text-white/[0.025]"
      >
        §
      </span>
      <Reveal
        className={`${FRAME} relative flex flex-col items-center py-32 text-center sm:py-44`}
      >
        <p className="flex items-center gap-4 font-display text-base italic text-brand">
          <span aria-hidden className="h-px w-10 bg-gold-foil" />
          Begin today
          <span aria-hidden className="h-px w-10 bg-gold-foil" />
        </p>
        <h2
          id="closing-title"
          className="mt-8 max-w-4xl text-5xl font-light leading-[1.02] text-ivory sm:text-7xl lg:text-8xl"
        >
          The document you need,{" "}
          <em className="foil-text font-light italic">done properly.</em>
        </h2>
        <p className="mt-8 max-w-xl text-lg leading-relaxed text-ivory/65">
          Browse everything freely — sign in only when you&apos;re ready to make
          or buy something.
        </p>
        <div className="mt-12 flex flex-wrap justify-center gap-3">
          <Link href="/documents/custom" className="btn-gold">
            <Icon icon={Sparkles} size="xs" />
            Draft with AI
          </Link>
          <Link href="/documents" className="btn-line-inverse">
            Browse templates
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
