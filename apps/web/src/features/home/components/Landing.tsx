import type { ContentCategory } from "@pratikar/types";
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  Check,
  FileText,
  House,
  IndianRupee,
  KeyRound,
  Laptop,
  ListChecks,
  Lock,
  MessageCircle,
  MessagesSquare,
  Receipt,
  Scale,
  ShieldCheck,
  Sparkles,
  UserCheck,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { CatalogueCover } from "@/shared/components/CatalogueCard";
import { Icon } from "@/shared/components/Icon";
import { COURSES_LIVE } from "@/shared/lib/features";
import { CONTENT_CATEGORY_LABELS } from "@/shared/lib/labels";
import { categoryHref } from "@/shared/lib/navigation";

import { countLabel, type CatalogueSummary } from "../lib/catalogueSummary";

import {
  CertificateArt,
  DraftingArt,
  FormArt,
  LibraryArt,
  PhoneChatArt,
  Seal,
} from "./illustrations";

/** The page's horizontal frame — every section lines up on it. */
export const FRAME = "mx-auto max-w-shell px-4 sm:px-6 lg:px-8";

const GOLD_BUTTON =
  "inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3.5 text-sm font-semibold text-on-brand shadow-raised transition-[background-color,transform] hover:-translate-y-0.5 hover:bg-brand-hover motion-reduce:transform-none";

const NAVY_BUTTON =
  "inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-ink-inverse shadow-raised transition-[background-color,transform] hover:-translate-y-0.5 hover:bg-primary-hover motion-reduce:transform-none";

const OUTLINE_BUTTON =
  "inline-flex items-center gap-2 rounded-full border border-line-strong bg-surface px-6 py-3.5 text-sm font-semibold text-ink transition-colors hover:border-ink-subtle";

const GHOST_INVERSE_BUTTON =
  "inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3.5 text-sm font-semibold text-ink-inverse transition-colors hover:bg-white/10";

/**
 * A section's heading: a small eyebrow, a big sans title that may carry one
 * italic serif word, and one sentence of why. Centred for sections that
 * stand alone; left-aligned where it sits beside its content.
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
        align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-2xl"
      }
    >
      <p className={`eyebrow ${dark ? "text-brand" : ""}`}>
        <span aria-hidden className="h-px w-6 bg-current" />
        {eyebrow}
      </p>
      <h2
        id={id}
        className={`mt-4 text-3xl font-extrabold leading-[1.1] sm:text-5xl sm:leading-[1.06] ${dark ? "text-ink-inverse" : "text-ink"}`}
      >
        {title}
      </h2>
      {description && (
        <p
          className={`mt-5 text-lg leading-relaxed ${dark ? "text-ink-inverse-muted" : "text-ink-muted"}`}
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

/** A small "New" tag, gold. */
function NewTag() {
  return (
    <span className="inline-flex w-fit items-center gap-1 rounded-full bg-brand px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-on-brand">
      <Icon icon={Sparkles} size="xs" />
      New
    </span>
  );
}

/* ───────────────────────────────────────────────────────── trust strip */

/**
 * Jasper's "trusted by" logo strip, made honest: there are no client logos
 * to show yet, so the strip shows what the platform is actually built on —
 * the advocate-written documents themselves, their real titles sliding by.
 */
export function TrustMarquee({ summary }: { summary: CatalogueSummary }) {
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
      className="border-y border-line bg-surface py-8"
    >
      <p className="px-4 text-center text-sm font-medium text-ink-muted">
        Built on{" "}
        <span className="font-semibold text-ink">
          {countLabel(library)} documents
        </span>{" "}
        written by practising advocates
      </p>
      {/* The row twice over, slid by half its width, so the loop is
          seamless. Paused on hover; still for reduced motion. */}
      <div className="relative mt-6 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        <ul className="flex w-max gap-3 hover:[animation-play-state:paused] motion-safe:animate-marquee">
          {[...titles, ...titles].map((title, index) => (
            <li
              key={`${title}-${index}`}
              aria-hidden={index >= titles.length || undefined}
              className="flex shrink-0 items-center gap-2 rounded-full border border-line bg-paper px-4 py-2 text-sm text-ink"
            >
              <Icon icon={FileText} size="xs" className="text-gold-ink" />
              {title}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────── platform overview */

/**
 * The platform in three cards, the way Jasper introduces its own: one dark
 * card for the flagship (AI drafting with an advocate in the loop), two
 * light ones for the ready catalogue and for learning. Real counts only.
 */
export function PlatformOverview({ summary }: { summary: CatalogueSummary }) {
  const ready = summary.templates.count + summary.library.FORM.count;
  const learn = summary.library.EBOOK.count + summary.library.CHECKLIST.count;

  return (
    <section aria-labelledby="platform-title" className={`${FRAME} py-24`}>
      <SectionHeading
        id="platform-title"
        align="center"
        eyebrow="The platform"
        title={
          <>
            One place for the paperwork{" "}
            <span className="accent-serif text-gold-ink">in your life</span>
          </>
        }
        description="Renting a flat, hiring your first employee, going to court — start with the right document, then understand what it means."
      />

      <div className="mt-16 grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-3">
        <Link
          href="/documents/custom"
          data-surface="inverse"
          className="group relative flex min-h-[30rem] flex-col overflow-hidden rounded-panel bg-hero-navy p-8 text-ink-inverse shadow-float transition-transform hover:-translate-y-1 motion-reduce:transform-none"
        >
          <NewTag />
          <h3 className="mt-6 font-display text-3xl font-extrabold leading-tight tracking-tight text-ink-inverse">
            Draft anything with AI
          </h3>
          <p className="mt-3 text-base leading-relaxed text-ink-inverse-muted">
            Describe it in your own words. The AI drafts it in the format of our
            advocate-written documents — and an advocate reviews it.
          </p>
          <div className="mt-6">
            <MoreLink tone="dark">Draft my document</MoreLink>
          </div>
          <DraftingArt className="pointer-events-none absolute -bottom-10 -right-8 w-[78%] max-w-[20rem] opacity-95 transition-transform duration-500 group-hover:scale-[1.04] motion-reduce:transform-none" />
        </Link>

        <PlatformCard
          href="/documents"
          badge={ready > 0 ? `${countLabel(ready)} ready` : undefined}
          title="Ready documents"
          body="Templates you fill in on a form or by chat, and legal forms to download — agreements, affidavits, notices."
          points={[
            "Finished Word and PDF",
            "Plain-language questions",
            "Optional advocate review",
          ]}
          cta="Create a document"
          art={<FormArt className="h-40 w-auto" />}
        />

        <PlatformCard
          href="/content-library"
          badge={learn > 0 ? `${countLabel(learn)} guides` : undefined}
          title="Learn the law you use"
          body={`E-books and checklists in plain language${COURSES_LIVE ? ", and video courses with a certificate" : ""}.`}
          points={[
            "Property, business and courts",
            "Checklists before you sign",
            COURSES_LIVE ? "Verifiable certificates" : "Courses coming soon",
          ]}
          cta="Browse the library"
          art={<LibraryArt className="h-40 w-auto" />}
        />
      </div>
    </section>
  );
}

function PlatformCard({
  href,
  badge,
  title,
  body,
  points,
  cta,
  art,
}: {
  href: string;
  badge?: string;
  title: string;
  body: string;
  points: string[];
  cta: string;
  art: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex min-h-[30rem] flex-col overflow-hidden rounded-panel border border-line bg-paper transition-[transform,box-shadow] hover:-translate-y-1 hover:shadow-float motion-reduce:transform-none"
    >
      <div className="grid h-48 place-items-center bg-[radial-gradient(ellipse_at_50%_100%,theme(colors.navy.50),transparent_70%)]">
        <div className="transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none">
          {art}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-8 pt-4">
        {badge && (
          <span className="w-fit rounded-full bg-surface px-2.5 py-1 text-xs font-semibold tabular-nums text-gold-ink ring-1 ring-brand-border">
            {badge}
          </span>
        )}
        <h3 className="mt-3 font-display text-2xl font-extrabold tracking-tight text-ink">
          {title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">{body}</p>
        <ul className="mt-5 space-y-2 text-sm text-ink">
          {points.map((point) => (
            <li key={point} className="flex items-center gap-2">
              <Icon icon={Check} size="xs" className="text-success" />
              {point}
            </li>
          ))}
        </ul>
        <div className="mt-auto pt-6">
          <MoreLink>{cta}</MoreLink>
        </div>
      </div>
    </Link>
  );
}

/* ───────────────────────────────────────────────────── feature rows */

/**
 * One feature, Jasper-style: copy on one side, the product on the other,
 * alternating down the page so it reads as a walk through the product.
 */
function FeatureRow({
  id,
  eyebrow,
  isNew = false,
  title,
  body,
  points,
  cta,
  visual,
  flip = false,
}: {
  id: string;
  eyebrow: string;
  isNew?: boolean;
  title: ReactNode;
  body: string;
  points: string[];
  cta: { href: string; label: string };
  visual: ReactNode;
  flip?: boolean;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] items-center gap-12 lg:grid-cols-2 lg:gap-20">
      <div className={flip ? "lg:order-last" : ""}>
        <div className="flex items-center gap-3">
          <p className="eyebrow">{eyebrow}</p>
          {isNew && <NewTag />}
        </div>
        <h3
          id={id}
          className="mt-4 font-display text-3xl font-extrabold leading-[1.1] tracking-tight text-ink sm:text-4xl"
        >
          {title}
        </h3>
        <p className="mt-4 text-lg leading-relaxed text-ink-muted">{body}</p>
        <ul className="mt-6 space-y-3">
          {points.map((point) => (
            <li key={point} className="flex gap-3 text-base text-ink">
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary text-brand">
                <Icon icon={Check} size="xs" className="h-3 w-3" />
              </span>
              {point}
            </li>
          ))}
        </ul>
        <Link href={cta.href} className={`${NAVY_BUTTON} mt-8`}>
          {cta.label}
          <Icon icon={ArrowRight} size="xs" />
        </Link>
      </div>
      <div aria-hidden className="relative select-none">
        {visual}
      </div>
    </div>
  );
}

/** A soft panel the product pictures sit on. */
function Stage({
  children,
  tone = "paper",
  className = "",
}: {
  children: ReactNode;
  tone?: "paper" | "navy";
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-panel p-6 sm:p-10 ${
        tone === "navy"
          ? "bg-hero-navy"
          : "bg-[linear-gradient(150deg,theme(colors.gold.50),theme(colors.paper)_45%,theme(colors.navy.50))] ring-1 ring-line"
      } ${className}`}
    >
      {children}
    </div>
  );
}

/** The drafting journey: the customer's sentence, the draft, the review. */
function DraftingVisual() {
  return (
    <Stage>
      <div className="space-y-5">
        <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-primary p-4 text-sm leading-relaxed text-ink-inverse shadow-overlay">
          &ldquo;Rent agreement for my flat in Bandra — ₹45,000 a month, 11
          months, two months&apos; deposit.&rdquo;
        </div>
        <div className="relative rounded-2xl bg-surface p-6 shadow-float ring-1 ring-line">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-gold-ink">
            Draft ready
          </p>
          <p className="mt-1 font-serif text-xl font-semibold text-ink">
            Leave and Licence Agreement
          </p>
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary-subtle px-2.5 py-1 text-xs font-medium text-primary">
            <Icon icon={BadgeCheck} size="xs" />
            In the format of our advocate-written agreement
          </p>
          <div className="mt-5 space-y-2">
            {["w-full", "w-11/12", "w-10/12", "w-full", "w-8/12"].map(
              (width, index) => (
                <div
                  key={width + index}
                  className={`h-2 ${width} rounded-full bg-navy-100`}
                />
              ),
            )}
          </div>
          <Seal className="absolute -bottom-8 -right-5 h-24 w-24 rotate-12 drop-shadow-xl" />
        </div>
        <div className="flex max-w-[80%] items-center gap-3 rounded-2xl bg-surface p-4 shadow-float ring-1 ring-line">
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
    </Stage>
  );
}

/** A template being filled in by chat, with the form fields filling up. */
function FillByChatVisual() {
  const fields = [
    ["Employee name", "Priya Sharma"],
    ["Designation", "Senior Designer"],
    ["Annual CTC", "₹9,60,000"],
    ["Joining date", "1 November 2026"],
  ];
  return (
    <Stage>
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-3 rounded-2xl bg-surface p-4 shadow-float ring-1 ring-line">
          <p className="flex items-center gap-2 text-xs font-semibold text-ink">
            <Icon icon={MessagesSquare} size="xs" className="text-gold-ink" />
            Fill by chat
          </p>
          <p className="w-fit max-w-[90%] rounded-2xl rounded-tl-sm bg-paper px-3 py-2 text-xs leading-relaxed text-ink">
            What&apos;s the annual salary on offer?
          </p>
          <p className="ml-auto w-fit max-w-[90%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-xs text-ink-inverse">
            9.6 lakh a year
          </p>
          <p className="w-fit max-w-[90%] rounded-2xl rounded-tl-sm bg-paper px-3 py-2 text-xs leading-relaxed text-ink">
            Got it — ₹9,60,000. And the joining date?
          </p>
        </div>
        <div className="rounded-2xl bg-surface p-4 shadow-float ring-1 ring-line">
          <p className="font-serif text-base font-semibold text-ink">
            Employment Offer Letter
          </p>
          <dl className="mt-3 space-y-2.5">
            {fields.map(([label, value]) => (
              <div key={label}>
                <dt className="text-[0.65rem] uppercase tracking-wider text-ink-subtle">
                  {label}
                </dt>
                <dd className="mt-0.5 flex items-center justify-between gap-2 rounded-lg border border-line bg-canvas px-2.5 py-1.5 text-xs font-medium text-ink">
                  {value}
                  <Icon icon={Check} size="xs" className="text-success" />
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </Stage>
  );
}

/**
 * The flagship and the three ways in, walked through one at a time:
 * AI drafting, templates by chat, the assistant, and courses.
 */
export function FeatureRows() {
  return (
    <section
      aria-labelledby="features-title"
      className="border-y border-line bg-surface"
    >
      <div className={`${FRAME} py-24`}>
        <SectionHeading
          id="features-title"
          align="center"
          eyebrow="How Pratikar helps"
          title={
            <>
              Built for documents you&apos;ll{" "}
              <span className="accent-serif text-gold-ink">actually sign</span>
            </>
          }
          description="Every way in ends the same way: a document that's right, in your hands, ready to use."
        />

        <div className="mt-20 space-y-28">
          <FeatureRow
            id="feature-drafting"
            eyebrow="AI drafting"
            isNew
            title="Your words in. A reviewed legal document out."
            body="Can't find a template? Describe what you need. The AI drafts it in about a minute, using our advocate-written documents as its reference — and a practising advocate checks it before you download."
            points={[
              "Preview free, ask for changes",
              "Advocate review before download",
              "Notified by email, SMS and push when it's ready",
            ]}
            cta={{ href: "/documents/custom", label: "Draft my document" }}
            visual={<DraftingVisual />}
          />
          <FeatureRow
            id="feature-templates"
            eyebrow="Ready templates"
            title="Answer a few questions. Get the finished document."
            body="Pick a template and fill it in on a form — or just chat, and the answers fill themselves in. Pay once and download Word and PDF."
            points={[
              "Plain-language questions, no jargon",
              "Word and PDF, ready to print",
              "Kept in your account to download again",
            ]}
            cta={{ href: "/documents", label: "Browse templates" }}
            visual={<FillByChatVisual />}
            flip
          />
          <FeatureRow
            id="feature-assistant"
            eyebrow="AI assistant"
            title="Not sure what you need? Just ask."
            body="Describe your situation in English or Hindi. The assistant searches everything on the site and points you to the right document, form, e-book or course."
            points={[
              "Understands your situation, not just keywords",
              "Links straight to the right document",
              "Explains — it doesn't give advice on your case",
            ]}
            cta={{ href: "/assistant", label: "Ask the assistant" }}
            visual={
              <Stage tone="navy" className="flex justify-center !pb-0">
                <PhoneChatArt className="w-full max-w-[17rem] translate-y-6 drop-shadow-2xl" />
              </Stage>
            }
          />
          <FeatureRow
            id="feature-courses"
            eyebrow={COURSES_LIVE ? "Certificate courses" : "Coming soon"}
            title="Learn the law — and prove it."
            body="Short video courses on GST, property and running a business. Finish one and get a certificate with a code anyone can check."
            points={[
              "Short lessons at your own pace",
              "A quick test after each lesson",
              "A certificate anyone can verify",
            ]}
            cta={{
              href: "/courses",
              label: COURSES_LIVE ? "Explore courses" : "See what's coming",
            }}
            visual={
              <Stage className="grid place-items-center">
                <CertificateArt className="w-full max-w-md rotate-[-3deg] drop-shadow-2xl" />
              </Stage>
            }
            flip
          />
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────── topics */

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

/** Searches people run most — Coursera's "trending" row. */
const TRENDING = [
  "Rent agreement",
  "Affidavit",
  "Legal notice",
  "Partnership deed",
  "Power of attorney",
  "Offer letter",
  "Will",
  "NDA",
];

/**
 * The library by area of law, Coursera's "Explore categories": trending
 * searches as chips, then a card per topic with its count and examples.
 */
export function TopicExplorer({ summary }: { summary: CatalogueSummary }) {
  if (summary.categories.length === 0) return null;

  return (
    <section aria-labelledby="topics-title" className="bg-paper">
      <div className={`${FRAME} py-24`}>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            id="topics-title"
            eyebrow="Explore topics"
            title="Find it by the area of law"
            description="Every form, checklist and e-book is filed under the part of life it's for."
          />
          <Link href="/content-library" className={`${OUTLINE_BUTTON} group`}>
            Browse the whole library
            <Icon
              icon={ArrowRight}
              size="xs"
              className="transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none"
            />
          </Link>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-sm font-semibold text-ink">Trending:</span>
          {TRENDING.map((term) => (
            <Link
              key={term}
              href={`/search?q=${encodeURIComponent(term)}`}
              className="rounded-full border border-line-strong bg-surface px-4 py-1.5 text-sm text-ink transition-colors hover:border-primary hover:bg-primary hover:text-ink-inverse"
            >
              {term}
            </Link>
          ))}
        </div>

        <ul className="mt-10 grid grid-cols-[minmax(0,1fr)] gap-5 sm:grid-cols-2 lg:grid-cols-6">
          {summary.categories.map((entry, index) => (
            <li
              key={entry.category}
              className={index < 3 ? "lg:col-span-2" : "lg:col-span-3"}
            >
              <Link
                href={categoryHref(entry.category)}
                className="group relative flex h-full flex-col overflow-hidden rounded-panel border border-line bg-surface p-7 transition-[transform,box-shadow,border-color] hover:-translate-y-1 hover:border-brand-border hover:shadow-float motion-reduce:transform-none"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary text-brand transition-transform duration-300 group-hover:-rotate-6 motion-reduce:transform-none">
                    <Icon icon={CATEGORY_ICONS[entry.category]} size="lg" />
                  </span>
                  <span className="text-right">
                    <span className="block font-display text-3xl font-extrabold tabular-nums tracking-tight text-ink">
                      {entry.count}
                    </span>
                    <span className="block text-xs text-ink-subtle">items</span>
                  </span>
                </div>
                <h3 className="mt-6 font-display text-xl font-bold tracking-tight text-ink">
                  {CONTENT_CATEGORY_LABELS[entry.category]}
                </h3>
                <p className="mt-1 text-sm text-ink-muted">
                  {CATEGORY_BLURBS[entry.category]}
                </p>
                {entry.examples.length > 0 && (
                  <ul className="mt-5 space-y-1.5 border-t border-line pt-4 text-sm text-ink">
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
                <div className="mt-auto pt-5">
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

/* ───────────────────────────────────────────────────────── impact band */

/**
 * Jasper's big-number band, with only numbers the catalogue backs up —
 * counted from the rows on sale — and two that are promises the product
 * enforces, not statistics.
 */
export function ImpactBand({ summary }: { summary: CatalogueSummary }) {
  const library =
    summary.library.FORM.count +
    summary.library.CHECKLIST.count +
    summary.library.EBOOK.count;
  const stats = [
    ...(library > 0
      ? [
          {
            value: countLabel(library),
            label: "advocate-written forms, checklists and e-books",
          },
        ]
      : []),
    ...(summary.categories.length > 0
      ? [
          {
            value: String(summary.categories.length),
            label: "areas of law, from property to the courts",
          },
        ]
      : []),
    { value: "100%", label: "of AI drafts reviewed by an advocate" },
    { value: "₹0", label: "to browse, search or ask the assistant" },
  ];

  return (
    <section
      aria-labelledby="impact-title"
      data-surface="inverse"
      className="relative overflow-hidden bg-hero-navy"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 top-0 h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(closest-side,rgb(212_175_55/0.14),transparent)]"
      />
      <div
        className={`${FRAME} relative grid grid-cols-[minmax(0,1fr)] gap-14 py-24 lg:grid-cols-[1fr_1.2fr] lg:items-center`}
      >
        <SectionHeading
          id="impact-title"
          tone="dark"
          eyebrow="Why Pratikar"
          title={
            <>
              Legal paperwork has to be{" "}
              <span className="accent-serif text-brand">right.</span>
            </>
          }
          description="So every document starts from one written by a practising advocate — and every AI draft is checked by one before it reaches you."
        />
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-panel bg-white/10 ring-1 ring-white/10">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col bg-surface-inverse/60 p-6 sm:p-9"
            >
              <dt className="mt-2 text-sm leading-relaxed text-ink-inverse-muted">
                {stat.label}
              </dt>
              <dd className="order-first font-display text-4xl font-extrabold tabular-nums tracking-tight text-brand sm:text-5xl">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
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
    <section aria-labelledby="how-title" className={`${FRAME} py-24`}>
      <SectionHeading
        id="how-title"
        align="center"
        eyebrow="How it works"
        title="From question to signed paper in four steps"
        description="No appointments, no jargon — and you only pay for what you take."
      />
      <ol className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, index) => (
          <li
            key={step.title}
            className="relative overflow-hidden rounded-panel border border-line bg-paper p-7"
          >
            <span
              aria-hidden
              className="absolute right-4 top-3 font-display text-7xl font-extrabold leading-none text-navy-100"
            >
              {index + 1}
            </span>
            <span className="relative grid h-12 w-12 place-items-center rounded-2xl bg-primary text-brand shadow-raised">
              <Icon icon={step.icon} size="md" />
            </span>
            <h3 className="relative mt-6 font-display text-lg font-bold tracking-tight text-ink">
              <span className="sr-only">Step {index + 1}: </span>
              {step.title}
            </h3>
            <p className="relative mt-2 text-sm leading-relaxed text-ink-muted">
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
    <section
      aria-labelledby="trust-title"
      className="border-y border-line bg-paper"
    >
      <div className={`${FRAME} py-24`}>
        <SectionHeading
          id="trust-title"
          align="center"
          eyebrow="Our promise"
          title="What we do to make sure it's right"
        />
        <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {ASSURANCES.map((item) => (
            <li
              key={item.title}
              className="rounded-panel border border-line bg-surface p-7 transition-shadow hover:shadow-float"
            >
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-subtle text-gold-ink ring-1 ring-brand-border">
                <Icon icon={item.icon} size="md" />
              </span>
              <h3 className="mt-5 font-display text-lg font-bold tracking-tight text-ink">
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
    <section aria-labelledby="faq-title" className={`${FRAME} py-24`}>
      <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <SectionHeading
            id="faq-title"
            eyebrow="Questions"
            title="Good to know"
            description="Quick answers about downloads, payments and reviews."
          />
          <Link href="/faq" className={`${OUTLINE_BUTTON} mt-8`}>
            All questions
            <Icon icon={ArrowRight} size="xs" />
          </Link>
        </div>
        <div className="space-y-3">
          {items.map((item) => (
            <details
              key={item.id}
              className="group/faq rounded-2xl border border-line bg-surface transition-shadow open:shadow-float"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 font-display text-base font-bold text-ink [&::-webkit-details-marker]:hidden">
                {item.question}
                <span
                  aria-hidden
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-paper text-lg text-primary transition-transform group-open/faq:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="whitespace-pre-line px-6 pb-6 text-sm leading-relaxed text-ink-muted">
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

const COLLAGE = [
  {
    kind: "document" as const,
    title: "Leave and Licence Agreement",
    place: "left-0 top-4 -rotate-6",
  },
  {
    kind: "ebook" as const,
    title: "Buying Your First Home",
    place: "right-0 top-0 rotate-6",
  },
  {
    kind: "checklist" as const,
    title: "Before You Sign a Lease",
    place: "bottom-0 left-8 rotate-3",
  },
  {
    kind: "form" as const,
    title: "General Affidavit",
    place: "bottom-6 right-6 -rotate-3",
  },
];

/**
 * The last invitation, Jasper's way: a headline and buttons over a collage
 * — here, catalogue covers fanned out like papers on a desk.
 */
export function ClosingBanner() {
  return (
    <section aria-labelledby="closing-title" className={`${FRAME} pt-24`}>
      <div
        data-surface="inverse"
        className="relative overflow-hidden rounded-[2.25rem] bg-hero-navy px-6 py-16 shadow-float sm:px-14 lg:py-20"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-40 -right-20 h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(closest-side,rgb(212_175_55/0.2),transparent)]"
        />
        <div className="relative grid grid-cols-[minmax(0,1fr)] items-center gap-12 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <h2
              id="closing-title"
              className="text-4xl font-extrabold leading-[1.06] text-ink-inverse sm:text-5xl lg:text-[3.4rem]"
            >
              Start with the document{" "}
              <span className="accent-serif text-brand">you need today.</span>
            </h2>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink-inverse-muted">
              Browse everything freely — sign in only when you&apos;re ready to
              make or buy something.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/documents/custom" className={GOLD_BUTTON}>
                <Icon icon={Sparkles} size="xs" />
                Draft with AI
              </Link>
              <Link href="/documents" className={GHOST_INVERSE_BUTTON}>
                Browse templates
              </Link>
              <Link href="/assistant" className={GHOST_INVERSE_BUTTON}>
                <Icon icon={MessageCircle} size="xs" />
                Ask a question
              </Link>
            </div>
          </div>

          <div
            aria-hidden
            className="relative mx-auto hidden h-80 w-full max-w-md select-none sm:block"
          >
            {COLLAGE.map((cover) => (
              <CatalogueCover
                key={cover.title}
                kind={cover.kind}
                title={cover.title}
                className={`!absolute w-60 rounded-2xl shadow-float ring-1 ring-white/10 ${cover.place}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export { GHOST_INVERSE_BUTTON, GOLD_BUTTON, NAVY_BUTTON, OUTLINE_BUTTON };
