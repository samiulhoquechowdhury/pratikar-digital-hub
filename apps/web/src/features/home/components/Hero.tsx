import { BrandMark } from "@pratikar/ui";
import {
  BadgeCheck,
  Bell,
  BookOpen,
  Check,
  FileText,
  FolderOpen,
  Lock,
  Receipt,
  Sparkles,
  UserCheck,
} from "lucide-react";

import { Icon } from "@/shared/components/Icon";

import { countLabel, type CatalogueSummary } from "../lib/catalogueSummary";

import { IntentSearch } from "./IntentSearch";
import { Seal } from "./illustrations";

const FRAME = "mx-auto max-w-shell px-4 sm:px-6 lg:px-8";

const TRUST = [
  { icon: BadgeCheck, label: "Advocate review on every AI draft" },
  { icon: Lock, label: "Secure Razorpay payments" },
  { icon: Receipt, label: "GST invoice with every order" },
];

/**
 * The hero, on warm paper the way Jasper opens: a big centred headline that
 * names the outcome, one input that takes people straight to it three ways,
 * and then the product itself — a full window of the drafting screen, not a
 * stock photo — so the first scroll already shows what you'd be using.
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
      className="relative isolate overflow-hidden bg-paper"
    >
      {/* A ruled grid that fades out, and two soft lights — gold behind the
          headline, navy under the window. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,theme(colors.navy.100/55%)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.navy.100/55%)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_60%_55%_at_50%_0%,black,transparent_80%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-12rem] -z-10 h-[36rem] w-[60rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(212_175_55/0.22),transparent)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 right-0 -z-10 h-1/2 bg-gradient-to-b from-transparent to-paper-deep"
      />

      <div className={`${FRAME} pb-16 pt-14 sm:pt-20 lg:pt-24`}>
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center motion-safe:animate-fade-up">
          <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/80 py-1 pl-1 pr-3.5 text-sm font-medium text-ink shadow-card backdrop-blur">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-primary text-brand">
              <BrandMark className="h-3 w-auto" />
            </span>
            Har Ghar Mein Kanooni Gyaan
          </p>

          <h1
            id="hero-title"
            className="mt-7 text-[2.6rem] font-extrabold leading-[1.04] text-ink sm:text-6xl lg:text-7xl"
          >
            Every legal document,{" "}
            <span className="relative whitespace-nowrap">
              <span className="accent-serif text-gold-ink">drafted right</span>
              <svg
                aria-hidden
                viewBox="0 0 300 12"
                preserveAspectRatio="none"
                className="absolute -bottom-1.5 left-0 h-3 w-full text-brand"
              >
                <path
                  d="M2 9 C 80 2, 220 2, 298 7"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            </span>{" "}
            — and checked by an advocate.
          </h1>

          <p className="mt-7 max-w-2xl text-lg leading-relaxed text-ink-muted sm:text-xl">
            Fill in a ready template, have AI draft anything from your own
            words, or download from hundreds of forms, checklists and e-books —
            in plain language, at fair prices.
          </p>

          <div className="mt-10 flex w-full justify-center">
            <IntentSearch />
          </div>

          <ul className="mt-8 flex flex-col items-center gap-3 text-sm text-ink-muted sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-7">
            {TRUST.map((item) => (
              <li key={item.label} className="flex items-center gap-2">
                <Icon icon={item.icon} className="text-gold-ink" />
                {item.label}
              </li>
            ))}
          </ul>
        </div>

        <HeroWindow />

        {stats.length > 0 && (
          <dl className="mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-y-8 sm:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col items-center text-center sm:border-l sm:border-line sm:first:border-l-0"
              >
                <dt className="mt-1 text-sm text-ink-muted">{stat.label}</dt>
                <dd className="order-first font-display text-4xl font-extrabold tabular-nums tracking-tight text-ink sm:text-5xl">
                  {countLabel(stat.value)}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────────────────── the window */

const SIDEBAR = [
  { icon: Sparkles, label: "AI drafting", active: true },
  { icon: FileText, label: "Templates" },
  { icon: BookOpen, label: "Library" },
  { icon: FolderOpen, label: "My documents" },
];

/**
 * The drafting screen in a browser window: the sidebar, the customer's own
 * sentence and the AI's reply, the draft with an advocate's seal, and the
 * notification that it's ready. Built from the product's own pieces so it
 * shows what the customer will actually see. Decorative — the headline says
 * it in words.
 */
function HeroWindow() {
  return (
    <div
      aria-hidden
      className="relative mx-auto mt-16 max-w-5xl select-none motion-safe:animate-fade-up sm:mt-20"
      style={{ animationDelay: "150ms" }}
    >
      <div className="overflow-hidden rounded-2xl bg-surface shadow-float ring-1 ring-black/5 sm:rounded-3xl">
        {/* Browser chrome */}
        <div className="flex items-center gap-3 border-b border-line bg-canvas px-4 py-3">
          <span className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-danger/40" />
            <span className="h-2.5 w-2.5 rounded-full bg-brand/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-success/40" />
          </span>
          <span className="mx-auto flex min-w-0 items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-xs text-ink-subtle">
            <Icon icon={Lock} size="xs" />
            <span className="truncate">pratikar.in/documents/custom</span>
          </span>
          <span className="hidden w-12 sm:block" />
        </div>

        <div className="grid min-h-[22rem] grid-cols-[minmax(0,1fr)] md:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:grid-cols-[11rem_minmax(0,1.05fr)_minmax(0,1fr)]">
          {/* Sidebar */}
          <div className="hidden border-r border-line bg-canvas p-3 lg:block">
            <span className="flex items-center gap-2 px-2 py-1.5">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-brand">
                <BrandMark className="h-3.5 w-auto" />
              </span>
              <span className="font-brand text-xs font-semibold tracking-wider text-gold-ink">
                PRATIKAR
              </span>
            </span>
            <ul className="mt-4 space-y-1">
              {SIDEBAR.map((item) => (
                <li
                  key={item.label}
                  className={`flex items-center gap-2 rounded-lg px-2 py-2 text-xs font-medium ${
                    item.active
                      ? "bg-primary text-ink-inverse"
                      : "text-ink-muted"
                  }`}
                >
                  <Icon
                    icon={item.icon}
                    size="xs"
                    className={item.active ? "text-brand" : ""}
                  />
                  {item.label}
                </li>
              ))}
            </ul>
          </div>

          {/* The conversation */}
          <div className="flex flex-col gap-4 p-5 sm:p-7">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-ink-subtle">
              Describe your document
            </p>
            <div className="ml-auto max-w-[92%] rounded-2xl rounded-br-sm bg-primary px-4 py-3 text-left text-sm leading-relaxed text-ink-inverse">
              Partnership deed for my bakery with my cousin in Pune — 60:40
              profit share, ₹5 lakh capital, 3 months&apos; notice to exit.
            </div>
            <div className="flex max-w-[92%] gap-2.5">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand text-on-brand">
                <Icon icon={Sparkles} size="xs" />
              </span>
              <div className="rounded-2xl rounded-tl-sm bg-paper px-4 py-3 text-left text-sm leading-relaxed text-ink">
                Your draft is ready — in the format of our advocate-written
                partnership deed. Preview it free, then send it for review.
              </div>
            </div>
            <ol className="mt-auto grid grid-cols-3 gap-2 pt-2 text-left">
              {[
                { label: "Drafted", state: "done" },
                { label: "Advocate review", state: "done" },
                { label: "Ready", state: "now" },
              ].map((step) => (
                <li
                  key={step.label}
                  className={`rounded-xl border px-2.5 py-2 text-[0.7rem] font-semibold ${
                    step.state === "now"
                      ? "border-brand bg-brand-subtle text-gold-ink"
                      : "border-line text-ink-muted"
                  }`}
                >
                  <span className="mb-1 grid h-4 w-4 place-items-center rounded-full bg-success text-ink-inverse">
                    <Icon icon={Check} size="xs" className="h-2.5 w-2.5" />
                  </span>
                  {step.label}
                </li>
              ))}
            </ol>
          </div>

          {/* The draft */}
          <div className="relative hidden border-l border-line bg-[linear-gradient(160deg,theme(colors.navy.50),theme(colors.paper))] p-6 md:block">
            <div className="relative rotate-[1.5deg] rounded-lg bg-surface p-6 text-left shadow-overlay ring-1 ring-black/5">
              <p className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-gold-ink">
                Draft · v2
              </p>
              <p className="mt-1 font-serif text-xl font-semibold text-ink">
                Partnership Deed
              </p>
              <p className="mt-0.5 text-[0.7rem] text-ink-subtle">
                Pune · 2 partners · 60:40
              </p>
              <div className="mt-5 space-y-2">
                {["w-full", "w-11/12", "w-10/12", "w-full", "w-8/12"].map(
                  (width, index) => (
                    <div
                      key={width + index}
                      className={`h-1.5 ${width} rounded-full ${index === 2 ? "bg-brand/60" : "bg-navy-100"}`}
                    />
                  ),
                )}
              </div>
              <div className="mt-6 grid grid-cols-2 gap-5">
                {["First partner", "Second partner"].map((party) => (
                  <div key={party}>
                    <div className="h-px bg-ink/25" />
                    <p className="mt-1 text-[0.55rem] uppercase tracking-wider text-ink-subtle">
                      {party}
                    </p>
                  </div>
                ))}
              </div>
              <Seal className="absolute -bottom-8 -right-5 h-24 w-24 rotate-12 drop-shadow-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Floating notes around the window */}
      <div className="absolute -left-3 bottom-24 hidden items-center gap-2.5 rounded-2xl bg-surface px-3.5 py-2.5 shadow-float ring-1 ring-black/5 motion-safe:animate-float sm:flex lg:-left-14">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-success-subtle text-success-text">
          <Icon icon={UserCheck} size="sm" />
        </span>
        <span className="text-left">
          <span className="block text-sm font-semibold text-ink">
            Advocate approved
          </span>
          <span className="block text-xs text-ink-muted">2 changes made</span>
        </span>
      </div>

      <div className="absolute -bottom-7 right-2 flex max-w-[17rem] items-start gap-3 rounded-2xl bg-surface-inverse px-4 py-3 text-left shadow-float motion-safe:animate-float-delayed sm:-right-6 lg:-right-12">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand text-on-brand">
          <Icon icon={Bell} size="sm" />
        </span>
        <span>
          <span className="block text-sm font-semibold text-ink-inverse">
            Your document is ready
          </span>
          <span className="block text-xs text-ink-inverse-muted">
            Word + PDF · tap to download
          </span>
        </span>
      </div>
    </div>
  );
}
