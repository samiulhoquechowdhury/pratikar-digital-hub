import type { ContentCategory } from "@pratikar/types";
import { BrandMark } from "@pratikar/ui";
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  FilePenLine,
  FileText,
  House,
  IndianRupee,
  KeyRound,
  Laptop,
  ListChecks,
  Lock,
  MessagesSquare,
  Receipt,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
  UserCheck,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import {
  CATALOGUE_KINDS,
  type CatalogueKind,
} from "@/shared/components/CatalogueCard";
import { Icon } from "@/shared/components/Icon";
import { Reveal } from "@/shared/components/Reveal";
import { CONTENT_CATEGORY_LABELS } from "@/shared/lib/labels";
import { categoryHref } from "@/shared/lib/navigation";

import { countLabel, type CatalogueSummary } from "../lib/catalogueSummary";

import { FormArt, Seal } from "./illustrations";

/** The page's horizontal frame — every section lines up on it. */
export const FRAME = "mx-auto max-w-shell px-4 sm:px-6 lg:px-8";

/**
 * A section's heading, Coursera's way: a bold title, an optional line under
 * it, and a link to the rest on the far side.
 */
export function SectionHead({
  title,
  intro,
  id,
  aside,
}: {
  title: ReactNode;
  intro?: string;
  id: string;
  aside?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-3xl">
        <h2
          id={id}
          className="text-[1.75rem] font-bold leading-tight text-noir sm:text-[2.125rem]"
        >
          {title}
        </h2>
        {intro && (
          <p className="mt-3 text-lg leading-relaxed text-noir/70">{intro}</p>
        )}
      </div>
      {aside}
    </div>
  );
}

/** "View all →" — Coursera's quiet link at the end of a section heading. */
function ViewAll({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="group inline-flex shrink-0 items-center gap-1.5 font-semibold text-noir-raised"
    >
      <span className="link-draw">{children}</span>
      <Icon
        icon={ArrowRight}
        size="xs"
        className="transition-transform group-hover:translate-x-0.5"
      />
    </Link>
  );
}

/* ─────────────────────────────────────────────────────────── quick start */

const QUICK_START: {
  href: string;
  icon: LucideIcon;
  title: string;
  body: string;
  link: string;
  tone: string;
}[] = [
  {
    href: "/documents/custom",
    icon: FilePenLine,
    title: "Draft any document with AI",
    body: "Reviewed by a practising advocate before you download.",
    link: "Start drafting",
    tone: "bg-banner-sky",
  },
  {
    href: "/documents",
    icon: MessagesSquare,
    title: "Fill a template by chat",
    body: "Answer plain questions; get a finished Word and PDF.",
    link: "Browse templates",
    tone: "bg-banner-sand",
  },
  {
    href: "/assistant",
    icon: Sparkles,
    title: "Ask the AI assistant",
    body: "Describe your situation — it finds the right document.",
    link: "Ask a question",
    tone: "bg-banner-mint",
  },
];

/**
 * Three ways to begin, as Coursera sets three tiles under its hero:
 * an icon, a title, a line, a link.
 */
export function QuickStart() {
  return (
    <section aria-label="Ways to begin" className="bg-white">
      <ul className={`${FRAME} grid gap-4 pb-14 pt-6 md:grid-cols-3`}>
        {QUICK_START.map((tile, index) => (
          <Reveal as="li" key={tile.href} delay={index * 70}>
            <Link
              href={tile.href}
              className="group flex h-full items-start gap-4 rounded-xl border border-ivory-line bg-white p-5 transition-[border-color,box-shadow] hover:border-noir/30 hover:shadow-float"
            >
              <span
                className={`grid h-12 w-12 shrink-0 place-items-center rounded-lg ${tile.tone} text-noir`}
              >
                <Icon icon={tile.icon} size="md" />
              </span>
              <span className="min-w-0">
                <span className="block font-display text-lg font-bold text-noir">
                  {tile.title}
                </span>
                <span className="mt-1 block text-[0.9375rem] text-noir/65">
                  {tile.body}
                </span>
                <span className="mt-3 inline-flex items-center gap-1 font-semibold text-noir-raised">
                  {tile.link}
                  <Icon
                    icon={ArrowRight}
                    size="xs"
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </span>
              </span>
            </Link>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}

/* ─────────────────────────────────────────────────────── drafting promo */

/**
 * The flagship, as Coursera promotes Coursera Plus: a wide gradient card
 * with its own little logo, a headline, the steps, and one button.
 */
export function DraftingPromo() {
  return (
    <section aria-labelledby="promo-title" className="bg-white">
      <div className={`${FRAME} py-12`}>
        <Reveal>
          <div
            data-surface="inverse"
            className="relative isolate grid grid-cols-[minmax(0,1fr)] overflow-hidden rounded-2xl bg-noir-glow lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]"
          >
            <div className="px-6 py-10 sm:px-12 sm:py-14">
              <p className="flex flex-wrap items-center gap-2 font-display text-lg font-bold text-white">
                <span className="grid h-8 w-8 place-items-center rounded-md bg-white text-noir">
                  <BrandMark className="h-4 w-auto" />
                </span>
                Pratikar
                <span className="rounded bg-brand px-1.5 py-0.5 text-xs font-extrabold text-on-brand">
                  AI DRAFTING
                </span>
              </p>
              <h2
                id="promo-title"
                className="mt-6 max-w-xl text-3xl font-extrabold leading-tight text-white sm:text-4xl"
              >
                Can&apos;t find a template? Get it drafted — and checked by an
                advocate.
              </h2>
              <ol className="mt-8 grid gap-4 sm:grid-cols-3">
                {[
                  ["Describe it", "In your own words"],
                  ["AI drafts it", "In about a minute"],
                  ["Advocate reviews", "Before you download"],
                ].map(([title, body], index) => (
                  <li key={title} className="flex gap-3">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand text-sm font-bold text-on-brand">
                      {index + 1}
                    </span>
                    <span>
                      <span className="block font-semibold text-white">
                        {title}
                      </span>
                      <span className="block text-sm text-white/70">
                        {body}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Link href="/documents/custom" className="btn-gold">
                  Draft my document
                </Link>
                <span className="text-sm text-white/70">
                  Preview free · pay only when you download
                </span>
              </div>
            </div>
            <div
              aria-hidden
              className="relative hidden select-none items-center justify-center lg:flex"
            >
              <span className="absolute -right-20 h-[26rem] w-[26rem] rounded-full bg-white/[0.06]" />
              <div className="relative">
                <FormArt className="h-72 w-auto drop-shadow-2xl" />
                <Seal className="absolute -bottom-4 -right-6 h-24 w-24 rotate-12 drop-shadow-xl" />
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────────────────── area strip */

const CATEGORY_ICONS: Record<ContentCategory, LucideIcon> = {
  PROPERTY_DOCUMENTATION: House,
  BUSINESS_COMPLIANCE: Briefcase,
  LEGAL_PRACTICE: Scale,
  DIGITAL_CAREER: Laptop,
  CHECKLISTS_REFERENCE: ListChecks,
};

const CATEGORY_TINTS: Record<ContentCategory, string> = {
  PROPERTY_DOCUMENTATION: "bg-banner-sky",
  BUSINESS_COMPLIANCE: "bg-banner-sand",
  LEGAL_PRACTICE: "bg-banner-lilac",
  DIGITAL_CAREER: "bg-banner-mint",
  CHECKLISTS_REFERENCE: "bg-banner-blush",
};

/**
 * Coursera's "Learn from 350+ leading universities" strip, made honest:
 * there are no partner logos to show, so the strip shows what the library
 * is built on — documents by practising advocates — and its areas of law,
 * each with a live count.
 */
export function AreaStrip({ summary }: { summary: CatalogueSummary }) {
  const library =
    summary.library.FORM.count +
    summary.library.CHECKLIST.count +
    summary.library.EBOOK.count;
  if (summary.categories.length === 0) return null;

  return (
    <section aria-labelledby="areas-title" className="bg-ivory">
      <div className={`${FRAME} py-14`}>
        <h2
          id="areas-title"
          className="text-center text-xl font-bold text-noir sm:text-2xl"
        >
          {library > 0
            ? `${countLabel(library)} documents written by practising advocates`
            : "Documents written by practising advocates"}
        </h2>
        <ul className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {summary.categories.map((entry, index) => (
            <Reveal as="li" key={entry.category} delay={index * 50}>
              <Link
                href={categoryHref(entry.category)}
                className="flex h-full items-center gap-3 rounded-xl border border-ivory-line bg-white p-4 transition-[border-color,box-shadow] hover:border-noir/30 hover:shadow-float"
              >
                <span
                  className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg ${CATEGORY_TINTS[entry.category]} text-noir`}
                >
                  <Icon icon={CATEGORY_ICONS[entry.category]} />
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold leading-snug text-noir">
                    {CONTENT_CATEGORY_LABELS[entry.category]}
                  </span>
                  <span className="block text-sm text-noir/60">
                    {entry.count} documents
                  </span>
                </span>
              </Link>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────── trending now */

export interface TrendingItem {
  id: string;
  href: string;
  kind: CatalogueKind;
  title: string;
  meta: string;
}

export interface TrendingColumn {
  title: string;
  href: string;
  items: TrendingItem[];
}

/**
 * Coursera's "Trending now": a few columns, each a short list of real items
 * with a small thumbnail — fast to scan, one click to open.
 */
export function TrendingNow({ columns }: { columns: TrendingColumn[] }) {
  const live = columns.filter((column) => column.items.length > 0);
  if (live.length === 0) return null;

  return (
    <section aria-labelledby="trending-title" className="bg-white">
      <div className={`${FRAME} py-14`}>
        <SectionHead
          id="trending-title"
          title="Trending now"
          intro="A few of the documents people open most."
        />
        <div
          className={`mt-8 grid gap-5 sm:grid-cols-2 ${live.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}
        >
          {live.map((column, columnIndex) => (
            <Reveal
              key={column.title}
              delay={columnIndex * 70}
              className="rounded-xl border border-ivory-line bg-white p-5"
            >
              <h3 className="font-display text-lg font-bold text-noir">
                {column.title}
              </h3>
              <ol className="mt-4 space-y-4">
                {column.items.map((item) => {
                  const kind = CATALOGUE_KINDS[item.kind];
                  return (
                    <li key={item.id}>
                      <Link href={item.href} className="group flex gap-3">
                        <span
                          className={`grid h-12 w-12 shrink-0 place-items-center rounded-lg ${kind.dark ? "bg-noir text-brand" : "bg-banner-sky text-noir"}`}
                        >
                          <Icon icon={kind.icon} />
                        </span>
                        <span className="min-w-0">
                          <span className="line-clamp-2 font-semibold leading-snug text-noir group-hover:underline">
                            {item.title}
                          </span>
                          <span className="mt-0.5 block text-sm text-noir/60">
                            {item.meta}
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
              <div className="mt-5 border-t border-ivory-line pt-4">
                <ViewAll href={column.href}>See all</ViewAll>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────── explore chips */

/** Searches people run most — Coursera's "Explore categories" chips. */
const SEARCHES = [
  "Rent agreement",
  "Affidavit",
  "Legal notice",
  "Partnership deed",
  "Power of attorney",
  "Offer letter",
  "Will",
  "Bail application",
  "Gift deed",
  "GST",
  "NDA",
  "Sale deed",
];

export function ExploreChips() {
  return (
    <section aria-labelledby="explore-title" className="bg-white">
      <div className={`${FRAME} pb-14`}>
        <SectionHead id="explore-title" title="Explore popular searches" />
        <ul className="mt-6 flex flex-wrap gap-3">
          {SEARCHES.map((term) => (
            <li key={term}>
              <Link
                href={`/search?q=${encodeURIComponent(term)}`}
                className="inline-flex items-center gap-2 rounded-full border border-noir/20 px-4 py-2 font-semibold text-noir transition-colors hover:border-noir hover:bg-banner-sky"
              >
                <Icon icon={Search} size="xs" className="text-noir/50" />
                {term}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────── why pratikar */

/**
 * Coursera's outcome band, without invented numbers: one promise the
 * product enforces, and the six things it does to keep it. No testimonials
 * until there are real ones.
 */
const PROMISES: { title: string; body: string; icon: LucideIcon }[] = [
  {
    title: "Advocate review",
    body: "Every AI draft — and any document you choose — is checked by a practising advocate.",
    icon: UserCheck,
  },
  {
    title: "Written by advocates",
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
    body: "Your documents stay yours, behind links that expire. Delete your account any time.",
    icon: KeyRound,
  },
  {
    title: "Certificates you can check",
    body: "Each certificate carries a code anyone can verify, no account needed.",
    icon: BadgeCheck,
  },
];

export function WhyPratikar() {
  return (
    <section aria-labelledby="why-title" className="bg-ivory">
      <div
        className={`${FRAME} grid grid-cols-[minmax(0,1fr)] gap-12 py-16 lg:grid-cols-[0.9fr_1.6fr] lg:items-center`}
      >
        <Reveal>
          <p className="font-display text-7xl font-extrabold text-noir">100%</p>
          <h2
            id="why-title"
            className="mt-4 text-[1.75rem] font-bold leading-tight text-noir sm:text-[2.125rem]"
          >
            of AI drafts are reviewed by a practising advocate.
          </h2>
          <p className="mt-4 text-lg text-noir/70">
            Legal paperwork has to be right. Here is what we do to make sure it
            is.
          </p>
        </Reveal>
        <ul className="grid gap-4 sm:grid-cols-2">
          {PROMISES.map((item, index) => (
            <Reveal
              as="li"
              key={item.title}
              delay={(index % 2) * 70}
              className="rounded-xl bg-white p-5 shadow-card"
            >
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-banner-sky text-noir">
                <Icon icon={item.icon} />
              </span>
              <h3 className="mt-4 font-display text-lg font-bold text-noir">
                {item.title}
              </h3>
              <p className="mt-1 text-[0.9375rem] leading-relaxed text-noir/65">
                {item.body}
              </p>
            </Reveal>
          ))}
        </ul>
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
    <section aria-labelledby="prices-title" className="bg-white">
      <div className={`${FRAME} py-16`}>
        <SectionHead
          id="prices-title"
          title="Simple, one-time prices"
          intro="GST included and shown before you begin. No subscription — pay once for the document you take."
        />
        <ul
          className={`mt-8 grid gap-4 sm:grid-cols-2 ${prices.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}
        >
          {prices.map((price, index) => (
            <Reveal as="li" key={price.label} delay={index * 60}>
              <Link
                href={price.href}
                className="group flex h-full flex-col rounded-xl border border-ivory-line p-6 transition-[border-color,box-shadow] hover:border-noir/30 hover:shadow-float"
              >
                <p className="font-semibold text-noir/70">{price.label}</p>
                <p className="mt-3 text-sm text-noir/60">from</p>
                <p className="font-display text-4xl font-extrabold tabular-nums text-noir">
                  {price.from}
                </p>
                <p className="mt-3 flex-1 text-[0.9375rem] leading-relaxed text-noir/65">
                  {price.note}
                </p>
                <span className="mt-5 inline-flex items-center gap-1 font-semibold text-noir-raised">
                  Browse
                  <Icon
                    icon={ArrowRight}
                    size="xs"
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </span>
              </Link>
            </Reveal>
          ))}
        </ul>
        <p className="mt-5 text-sm text-noir/60">
          Generating and previewing a template is free — you pay only to
          download. An advocate&apos;s review is quoted on each document page.
        </p>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────── how it works */

const STEPS: { title: string; body: string; icon: LucideIcon }[] = [
  {
    title: "Find what you need",
    body: "Search, browse by area of law, or describe your situation to the assistant.",
    icon: Search,
  },
  {
    title: "Fill in your details",
    body: "Answer plain questions — on a form, or simply by chatting.",
    icon: FileText,
  },
  {
    title: "Pay once, securely",
    body: "One price with GST shown, through Razorpay, with a GST invoice.",
    icon: IndianRupee,
  },
  {
    title: "Download — or get it reviewed",
    body: "Word and PDF, ready to sign. Add an advocate's review first if you like.",
    icon: UserCheck,
  },
];

export function Process() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="process-title"
      className="scroll-mt-24 bg-white"
    >
      <div className={`${FRAME} py-16`}>
        <SectionHead
          id="process-title"
          title="How it works"
          intro="From question to signed paper in four steps — no appointments, no jargon."
        />
        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <Reveal
              as="li"
              key={step.title}
              delay={index * 60}
              className="relative rounded-xl border border-ivory-line p-6"
            >
              <span className="absolute right-5 top-4 font-display text-4xl font-extrabold text-ivory-deep">
                {index + 1}
              </span>
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-noir text-brand">
                <Icon icon={step.icon} />
              </span>
              <h3 className="mt-5 font-display text-lg font-bold text-noir">
                <span className="sr-only">Step {index + 1}: </span>
                {step.title}
              </h3>
              <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-noir/65">
                {step.body}
              </p>
            </Reveal>
          ))}
        </ol>
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
 * A few answers from the FAQ, Coursera-style — a plain list of questions
 * that open in place. Server-rendered <details>, so it works without
 * JavaScript; left out entirely until the client publishes FAQ entries.
 */
export function FaqTeaser({ items }: { items: FaqPreviewItem[] }) {
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="faq-title" className="bg-white">
      <div className={`${FRAME} py-16`}>
        <SectionHead
          id="faq-title"
          title="Frequently asked questions"
          aside={<ViewAll href="/faq">All questions</ViewAll>}
        />
        <div className="mt-8 divide-y divide-ivory-line border-y border-ivory-line">
          {items.map((item) => (
            <details key={item.id} className="group/faq">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-lg font-semibold text-noir [&::-webkit-details-marker]:hidden">
                {item.question}
                <span
                  aria-hidden
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-xl text-noir transition-transform group-open/faq:rotate-45 group-hover/faq:bg-ivory"
                >
                  +
                </span>
              </summary>
              <p className="whitespace-pre-line pb-6 pr-12 text-base leading-relaxed text-noir/70">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────── closing banner */

const PAPERS = [
  {
    title: "Rent Agreement",
    kind: "Template",
    place: "left-6 top-2 -rotate-6",
  },
  { title: "General Affidavit", kind: "Form", place: "right-4 top-8 rotate-6" },
  {
    title: "Before You Sign a Lease",
    kind: "Checklist",
    place: "bottom-0 left-16 rotate-2",
  },
];

/**
 * Coursera's last word — "Take the next step toward your goals" — over a
 * tinted panel with a picture on the side.
 */
export function ClosingBanner() {
  return (
    <section aria-labelledby="closing-title" className="bg-white">
      <div className={`${FRAME} pb-6 pt-6`}>
        <Reveal>
          <div className="relative isolate grid grid-cols-[minmax(0,1fr)] items-center gap-8 overflow-hidden rounded-2xl bg-banner-sky px-6 py-12 sm:px-12 lg:grid-cols-[1.3fr_1fr]">
            <span
              aria-hidden
              className="absolute -right-16 -top-16 -z-10 h-72 w-72 rounded-full bg-white/70"
            />
            <span
              aria-hidden
              className="absolute -bottom-20 right-48 -z-10 h-48 w-48 rounded-full bg-brand/20"
            />
            <div>
              <h2
                id="closing-title"
                className="text-3xl font-extrabold leading-tight text-noir sm:text-4xl"
              >
                Take the next step with the{" "}
                <span className="accent-serif">right document</span>.
              </h2>
              <p className="mt-4 max-w-lg text-lg text-noir/70">
                Browse everything freely — sign in only when you&apos;re ready
                to make or buy something.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/signup" className="btn-noir">
                  Join for free
                </Link>
                <Link href="/documents" className="btn-line">
                  Browse documents
                </Link>
              </div>
            </div>
            <div
              aria-hidden
              className="relative hidden h-56 select-none lg:block"
            >
              {PAPERS.map((paper) => (
                <div
                  key={paper.title}
                  className={`absolute w-52 rounded-xl bg-white p-4 shadow-float ${paper.place}`}
                >
                  <p className="text-xs font-bold uppercase tracking-wide text-gold-ink">
                    {paper.kind}
                  </p>
                  <p className="mt-1 font-display font-bold text-noir">
                    {paper.title}
                  </p>
                  <div className="mt-3 space-y-1.5">
                    <div className="h-1.5 w-full rounded-full bg-ivory-deep" />
                    <div className="h-1.5 w-4/5 rounded-full bg-ivory-deep" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
