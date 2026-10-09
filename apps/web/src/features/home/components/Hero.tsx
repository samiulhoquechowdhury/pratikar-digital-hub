import {
  BadgeCheck,
  Bell,
  FileText,
  Lock,
  Receipt,
  Sparkles,
} from "lucide-react";

import { Icon } from "@/shared/components/Icon";

import { countLabel, type CatalogueSummary } from "../lib/catalogueSummary";

import { IntentSearch } from "./IntentSearch";
import { PillarsBackdrop, Seal } from "./illustrations";

const FRAME = "mx-auto max-w-shell px-4 sm:px-6 lg:px-8";

const TRUST = [
  { icon: BadgeCheck, label: "Advocate review on every AI draft" },
  { icon: Lock, label: "Secure Razorpay payments" },
  { icon: Receipt, label: "GST invoice with every order" },
];

/**
 * The hero. In one screen it has to say what this is, prove it's real, and
 * let someone act — so the headline names the outcome, the search takes
 * them straight to it three ways, and the illustration shows the product's
 * actual journey: a drafted agreement, an advocate's seal, the "it's ready"
 * notification. Stats underneath are counted from the live catalogue.
 */
export function LandingHero({ summary }: { summary: CatalogueSummary }) {
  const stats = [
    { value: summary.library.FORM.count, label: "Legal forms" },
    { value: summary.library.CHECKLIST.count, label: "Checklists" },
    { value: summary.library.EBOOK.count, label: "E-books" },
    { value: summary.templates.count, label: "Ready templates" },
  ].filter((stat) => stat.value > 0);

  return (
    <section
      aria-labelledby="hero-title"
      className="relative isolate overflow-hidden bg-hero-navy"
    >
      <PillarsBackdrop className="pointer-events-none absolute inset-0 -z-10 h-full w-full" />
      {/* A warm glow behind the illustration, and a soft vignette at the
          bottom so the stats strip reads cleanly. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 top-10 -z-10 h-[38rem] w-[38rem] rounded-full bg-[radial-gradient(closest-side,rgb(212_175_55/0.16),transparent)]"
      />

      <div
        className={`${FRAME} grid grid-cols-[minmax(0,1fr)] items-center gap-14 pb-14 pt-14 sm:pt-20 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)] lg:gap-10 lg:pb-20 lg:pt-24`}
      >
        <div className="motion-safe:animate-fade-up">
          <p className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3.5 py-1.5 text-sm font-medium text-brand">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-brand" />
            Har Ghar Mein Kanooni Gyaan
          </p>

          <h1
            id="hero-title"
            className="mt-6 font-display text-[2.6rem] font-semibold leading-[1.08] tracking-tight text-ink-inverse sm:text-6xl lg:text-[3.6rem]"
          >
            Every legal document,{" "}
            <span className="relative whitespace-nowrap text-brand">
              drafted right
              <svg
                aria-hidden
                viewBox="0 0 300 12"
                preserveAspectRatio="none"
                className="absolute -bottom-1 left-0 h-2.5 w-full text-brand/60"
              >
                <path
                  d="M2 9 C 80 2, 220 2, 298 7"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            </span>{" "}
            — and checked by an advocate.
          </h1>

          <p className="mt-7 max-w-xl text-lg leading-relaxed text-ink-inverse-muted sm:text-xl">
            Fill in a ready template, have AI draft anything from your own
            words, or download from hundreds of forms, checklists and e-books.
            Plain language, fair prices, and an advocate&apos;s review when it
            matters.
          </p>

          <div className="mt-9">
            <IntentSearch />
          </div>

          <ul className="mt-9 flex flex-col gap-3 text-sm text-ink-inverse sm:flex-row sm:flex-wrap sm:gap-x-6">
            {TRUST.map((item) => (
              <li key={item.label} className="flex items-center gap-2">
                <Icon icon={item.icon} className="text-brand" />
                {item.label}
              </li>
            ))}
          </ul>
        </div>

        <HeroIllustration />
      </div>

      {stats.length > 0 && (
        <div className="border-t border-white/10 bg-navy-950/40 backdrop-blur-sm">
          <dl
            className={`${FRAME} grid grid-cols-2 divide-white/10 py-6 sm:grid-cols-4 sm:divide-x`}
          >
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col px-2 py-2 sm:px-6 sm:first:pl-0"
              >
                <dt className="text-sm text-ink-inverse-muted">{stat.label}</dt>
                <dd className="order-first font-display text-3xl font-semibold tabular-nums text-ink-inverse sm:text-4xl">
                  {countLabel(stat.value)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </section>
  );
}

/**
 * The product's journey in one picture: an agreement the AI drafted, the
 * advocate's seal on it, and the notification that it's ready. Built from
 * real interface pieces, so it shows what the customer will actually see.
 * Decorative — the headline says it in words.
 */
function HeroIllustration() {
  return (
    <div
      aria-hidden
      className="relative mx-auto w-full max-w-[32rem] select-none py-6 lg:py-0"
    >
      {/* The agreement */}
      <div className="relative rotate-[-2deg] rounded-2xl bg-surface p-7 shadow-[0_40px_80px_-20px_rgb(5_15_29/0.7)] ring-1 ring-black/5 sm:p-9">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-gold-ink">
              Drafted with AI
            </p>
            <p className="mt-1.5 font-display text-xl font-semibold leading-tight text-ink sm:text-2xl">
              Leave and Licence Agreement
            </p>
            <p className="mt-1 text-xs text-ink-muted">
              Pune · 11 months · 2 parties
            </p>
          </div>
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-subtle text-primary">
            <Icon icon={FileText} size="md" />
          </span>
        </div>

        <div className="mt-6 space-y-2.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink">
            Between
          </p>
          <div className="h-2 w-11/12 rounded-full bg-navy-100" />
          <div className="h-2 w-4/5 rounded-full bg-navy-100" />
          <p className="pt-2 text-xs font-semibold uppercase tracking-wider text-ink">
            Terms and conditions
          </p>
          {["w-full", "w-10/12", "w-11/12", "w-9/12"].map((width, index) => (
            <div key={width + index} className="flex items-center gap-2">
              <span className="w-4 text-[0.65rem] font-semibold text-ink-subtle">
                {index + 1}.
              </span>
              <div
                className={`h-2 ${width} rounded-full ${index === 1 ? "bg-brand/60" : "bg-navy-100"}`}
              />
            </div>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-2 gap-6">
          {["Licensor", "Licensee"].map((party) => (
            <div key={party}>
              <div className="h-px bg-ink/25" />
              <p className="mt-1.5 text-[0.65rem] uppercase tracking-wider text-ink-subtle">
                {party}
              </p>
            </div>
          ))}
        </div>

        <Seal className="absolute -bottom-9 -right-2 h-24 w-24 sm:-right-7 sm:h-28 sm:w-28 rotate-12 drop-shadow-xl sm:h-32 sm:w-32" />
      </div>

      {/* "AI draft ready" */}
      <div className="absolute -top-10 left-0 flex items-center gap-2.5 rounded-xl bg-surface px-3.5 py-2.5 shadow-overlay ring-1 ring-black/5 motion-safe:animate-float sm:-left-10">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-on-brand">
          <Icon icon={Sparkles} size="sm" />
        </span>
        <span>
          <span className="block text-sm font-semibold text-ink">
            AI draft ready
          </span>
          <span className="block text-xs text-ink-muted">
            Word + PDF preview
          </span>
        </span>
      </div>

      {/* Advocate review progress */}
      <div className="absolute right-0 top-1/3 w-48 sm:w-52 rounded-xl bg-surface-inverse-raised/95 p-4 shadow-overlay ring-1 ring-white/10 backdrop-blur motion-safe:animate-float-slow sm:-right-12">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand">
          Advocate review
        </p>
        <ol className="mt-3 space-y-2.5 text-sm text-ink-inverse">
          {[
            ["Drafted", true],
            ["Reviewed by advocate", true],
            ["Ready to download", true],
          ].map(([label, done]) => (
            <li key={label as string} className="flex items-center gap-2">
              <span
                className={`grid h-4 w-4 place-items-center rounded-full ${done ? "bg-brand text-on-brand" : "border border-white/30"}`}
              >
                <svg viewBox="0 0 12 12" className="h-2.5 w-2.5">
                  <path
                    d="M2.5 6.2 5 8.5 9.5 3.8"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              {label as string}
            </li>
          ))}
        </ol>
      </div>

      {/* The notification */}
      <div className="absolute -bottom-6 left-0 flex max-w-[17rem] items-start gap-3 rounded-xl bg-surface px-4 py-3 shadow-overlay ring-1 ring-black/5 motion-safe:animate-float-delayed sm:-left-8">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary text-brand">
          <Icon icon={Bell} size="sm" />
        </span>
        <span>
          <span className="block text-sm font-semibold text-ink">
            Your document is ready
          </span>
          <span className="block text-xs text-ink-muted">
            Reviewed by an advocate · tap to download
          </span>
        </span>
      </div>
    </div>
  );
}
