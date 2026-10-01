import {
  ArrowRight,
  BadgeCheck,
  Clock,
  Receipt,
  BookOpen,
  FileSignature,
  FileText,
  GraduationCap,
  IndianRupee,
  ListChecks,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import {
  CourseShelf,
  CoursesBanner,
  FeatureBanners,
  HeroSearch,
  HeroVisual,
  LibraryShelf,
  TemplateShelf,
} from "@/features/home";
import { Icon } from "@/shared/components/Icon";
import { LIBRARY_SHELVES } from "@/shared/lib/navigation";

/**
 * Everything the site sells, by kind — the catalogue's shape before anything
 * else, so a visitor can see in one line whether what they need is here.
 */
const KINDS: { href: string; label: string; hint: string; icon: LucideIcon }[] =
  [
    {
      href: "/documents",
      label: "Documents",
      hint: "Generated from your answers",
      icon: FileText,
    },
    {
      href: "/courses",
      label: "Courses",
      hint: "With a verifiable certificate",
      icon: GraduationCap,
    },
    ...LIBRARY_SHELVES.map((shelf) => ({
      href: `/content-library?shelf=${shelf.slug}`,
      label: shelf.label,
      hint: {
        EBOOK: "Guides to read and keep",
        CHECKLIST: "Step by step, before you sign",
        FORM: "Fill in the blanks yourself",
      }[shelf.type],
      icon: { EBOOK: BookOpen, CHECKLIST: ListChecks, FORM: FileSignature }[
        shelf.type
      ],
    })),
  ];

/** Three facts under the search — the questions a first-time visitor has. */
const HERO_POINTS: { label: string; icon: LucideIcon }[] = [
  { label: "Ready in minutes", icon: Clock },
  { label: "GST invoice included", icon: Receipt },
  { label: "Certificates you can verify", icon: BadgeCheck },
];

const STEPS = [
  {
    title: "Pick a template",
    body: "Rent, employment, business and property — each one drafted and reviewed before it reaches the catalogue.",
  },
  {
    title: "Answer the questions",
    body: "Plain language, no legal drafting. Your answers stay private to your account.",
  },
  {
    title: "Pay and download",
    body: "One price, GST included. Get a Word file and a PDF, ready to print and sign.",
  },
];

/**
 * Why someone should believe any of this. Claims only what the product
 * actually does — no student counts, no ratings, no testimonials until there
 * are real ones. On a site selling legal material, an invented number is a
 * worse first impression than a plain one.
 */
const ASSURANCES: { title: string; body: string; icon: LucideIcon }[] = [
  {
    title: "Reviewed before publishing",
    body: "Every template and course passes an internal review before it appears in the catalogue.",
    icon: ShieldCheck,
  },
  {
    title: "Certificates you can check",
    body: "Each certificate carries a code anyone can verify on this site, without an account.",
    icon: BadgeCheck,
  },
  {
    title: "Priced up front",
    body: "One price per item, GST shown. No subscription and no recurring charge — with a GST invoice every time.",
    icon: IndianRupee,
  },
];

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      {/* ---------------------------------------------------------- hero */}
      <section className="relative overflow-hidden border-b border-line">
        {/* A soft wash of the brand navy from the upper right — enough to
            give the page a sense of place without a band of solid colour. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(70rem_36rem_at_90%_-20%,theme(colors.primary.subtle),transparent_70%)]"
        />
        <div className="relative mx-auto grid max-w-shell items-center gap-16 px-4 pb-24 pt-14 sm:px-6 sm:pt-20 grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-12 lg:px-8 lg:pb-28">
          <div>
            {/* The client's line, kept in its own words. Navy rather than
                gold: gold text on white is 2.10:1. */}
            <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-sm font-medium text-primary shadow-card">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-brand" />
              Har Ghar Mein Kanooni Gyaan
            </p>
            <h1 className="mt-6 text-[2.6rem] leading-[1.06] sm:text-6xl sm:leading-[1.04]">
              Legal knowledge
              <br className="hidden sm:block" /> in{" "}
              <span className="relative whitespace-nowrap">
                every home.
                {/* Gold as a drawn stroke, not as text — the one way it can
                    sit on white. Decorative, so hidden. */}
                <svg
                  aria-hidden
                  viewBox="0 0 300 12"
                  preserveAspectRatio="none"
                  className="absolute -bottom-2 left-0 h-3 w-full text-brand"
                >
                  <path
                    d="M2 9C60 3 180 1 298 6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-ink-muted sm:text-xl">
              Documents you can generate in minutes, courses that end in a
              certificate, and guides written for people who aren&apos;t
              lawyers.
            </p>
            <div className="mt-10">
              <HeroSearch />
            </div>
            <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-3 border-t border-line pt-6">
              {HERO_POINTS.map((point) => (
                <li
                  key={point.label}
                  className="flex items-center gap-2 text-sm font-medium text-ink-muted"
                >
                  <Icon icon={point.icon} className="text-primary" />
                  {point.label}
                </li>
              ))}
            </ul>
          </div>

          {/* Hidden on phones: it would add a screen of scrolling before
              the catalogue, and the headline already says what it shows. */}
          <div className="hidden pb-10 md:block lg:pb-0">
            <HeroVisual />
          </div>
        </div>
      </section>

      {/* --------------------------------------------------- browse by kind */}
      <section className="mx-auto max-w-shell px-4 pt-16 sm:px-6 lg:px-8">
        <h2 className="text-sm font-semibold text-ink-muted">
          Browse everything
        </h2>
        <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {KINDS.map((kind) => (
            <li key={kind.label}>
              <Link
                href={kind.href}
                className="group flex h-full flex-col gap-4 rounded-card border border-line p-5 transition-[border-color,box-shadow] hover:border-line-strong hover:shadow-raised"
              >
                <span className="grid h-10 w-10 place-items-center rounded-control bg-primary-subtle text-primary">
                  <Icon icon={kind.icon} size="md" />
                </span>
                <span>
                  <span className="flex items-center gap-1 text-base font-semibold text-ink">
                    {kind.label}
                    <Icon
                      icon={ArrowRight}
                      size="xs"
                      className="text-ink-subtle opacity-0 transition-[opacity,transform] group-hover:translate-x-0.5 group-hover:opacity-100 motion-reduce:transform-none"
                    />
                  </span>
                  <span className="mt-1 block text-sm text-ink-muted">
                    {kind.hint}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ------------------------------------------------------ shelves */}
      <TemplateShelf />
      <CoursesBanner />
      <CourseShelf />
      <LibraryShelf />
      <FeatureBanners />

      {/* -------------------------------------------------- how it works */}
      <section className="mx-auto max-w-shell px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-card bg-surface-sunken px-6 py-12 sm:px-12">
          <h2 className="text-2xl font-semibold">How a document works</h2>
          <ol className="mt-10 grid gap-10 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title}>
                <span className="grid h-9 w-9 place-items-center rounded-full bg-surface text-sm font-semibold text-primary shadow-card">
                  {index + 1}
                </span>
                <h3 className="mt-5 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-base leading-relaxed text-ink-muted">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
          <Link
            href="/documents"
            className="mt-10 inline-flex items-center gap-2 rounded-control bg-primary px-5 py-2.5 text-sm font-semibold text-ink-inverse transition-colors hover:bg-primary-hover"
          >
            Browse document templates
            <Icon icon={ArrowRight} />
          </Link>
        </div>
      </section>

      {/* ----------------------------------------------------- assurances */}
      <section className="mx-auto max-w-shell px-4 py-8 sm:px-6 lg:px-8">
        <ul className="grid gap-10 md:grid-cols-3">
          {ASSURANCES.map((item) => (
            <li key={item.title} className="flex gap-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-control border border-line text-primary">
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
      </section>
    </>
  );
}
