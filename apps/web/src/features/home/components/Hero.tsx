import { Bell, Check } from "lucide-react";

import { Icon } from "@/shared/components/Icon";

import { countLabel, type CatalogueSummary } from "../lib/catalogueSummary";

import { IntentSearch } from "./IntentSearch";
import { Seal } from "./illustrations";

const FRAME = "mx-auto max-w-shell px-4 sm:px-6 lg:px-8";

/**
 * The hero. Noir, quiet and large: one serif headline that names the
 * outcome, one input that acts on it three ways, and beside it the thing
 * itself — a deed on ivory paper under an advocate's gold seal. The figures
 * along the foot are counted from the live catalogue.
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
      data-surface="inverse"
      className="relative isolate overflow-hidden bg-noir-glow text-ivory"
    >
      {/* Fine vertical rules, like the columns of the logo, fading out. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgb(255_255_255/0.045)_1px,transparent_1px)] [background-size:calc(100%/12)_100%] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -right-10 top-10 -z-10 select-none font-display text-[38rem] font-light leading-none text-white/[0.025]"
      >
        §
      </span>

      <div
        className={`${FRAME} grid grid-cols-[minmax(0,1fr)] items-center gap-16 pb-16 pt-16 sm:pt-24 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:pb-24 lg:pt-28`}
      >
        <div className="motion-safe:animate-fade-up">
          <p className="flex items-center gap-4 font-display text-base italic text-brand">
            <span aria-hidden className="h-px w-10 bg-gold-foil" />
            Har Ghar Mein Kanooni Gyaan
          </p>

          <h1
            id="hero-title"
            className="mt-8 text-[2.9rem] font-light leading-[1.02] text-ivory sm:text-7xl lg:text-[5.4rem]"
          >
            The legal document,{" "}
            <em className="foil-text font-normal italic motion-safe:animate-sheen">
              drafted right
            </em>
            <span className="text-ivory/90">
              {" "}
              — and reviewed by an advocate.
            </span>
          </h1>

          <p className="mt-8 max-w-xl text-lg leading-relaxed text-ivory/70">
            Fill in a ready template, have AI draft anything from your own
            words, or choose from hundreds of advocate-written forms, checklists
            and e-books — in plain language, at a fair, fixed price.
          </p>

          <div className="mt-12">
            <IntentSearch />
          </div>
        </div>

        <HeroDeed />
      </div>

      {stats.length > 0 && (
        <div className="border-t border-noir-line">
          <dl className={`${FRAME} grid grid-cols-2 sm:grid-cols-4`}>
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className={`flex flex-col py-8 sm:px-8 sm:first:pl-0 ${
                  index > 0 ? "sm:border-l sm:border-noir-line" : ""
                } ${index % 2 === 1 ? "border-l border-noir-line pl-6 sm:pl-8" : ""}`}
              >
                <dt className="mt-2 text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-ivory/50">
                  {stat.label}
                </dt>
                <dd className="order-first font-display text-5xl font-light tabular-nums text-ivory sm:text-6xl">
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
 * The product, still-life: a deed on ivory paper, the advocate's seal in
 * gold, and the notification that it's ready. Decorative — the headline says
 * it in words.
 */
function HeroDeed() {
  return (
    <div
      aria-hidden
      className="relative mx-auto w-full max-w-[26rem] select-none py-10 motion-safe:animate-fade-up lg:max-w-none"
      style={{ animationDelay: "200ms" }}
    >
      {/* The sheet beneath, for depth */}
      <div className="absolute inset-x-8 bottom-6 top-16 rotate-[4deg] bg-ivory-deep/90 shadow-[0_40px_80px_-30px_rgb(0_0_0/0.8)]" />

      <div className="relative rotate-[-2.5deg] bg-ivory px-8 pb-14 pt-10 text-noir shadow-[0_50px_100px_-30px_rgb(0_0_0/0.85)] sm:px-11">
        {/* Gold rule and engraved heading */}
        <div className="h-0.5 w-12 bg-gold-foil" />
        <p className="mt-6 text-[0.6rem] font-semibold uppercase tracking-[0.32em] text-gold-ink">
          Agreement · Pune
        </p>
        <p className="mt-2 font-display text-[1.75rem] font-normal leading-tight">
          Leave &amp; Licence
          <br />
          <span className="italic">Agreement</span>
        </p>

        <div className="mt-8 space-y-4">
          {[
            ["I.", ["w-full", "w-10/12"]],
            ["II.", ["w-11/12", "w-9/12", "w-10/12"]],
            ["III.", ["w-full", "w-7/12"]],
          ].map(([numeral, widths]) => (
            <div key={numeral as string} className="flex gap-3">
              <span className="w-6 shrink-0 font-display text-xs italic text-gold-ink">
                {numeral as string}
              </span>
              <div className="flex-1 space-y-2 pt-1">
                {(widths as string[]).map((width, index) => (
                  <div key={index} className={`h-[3px] ${width} bg-noir/15`} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 grid grid-cols-2 gap-8">
          {["Licensor", "Licensee"].map((party) => (
            <div key={party}>
              <svg viewBox="0 0 120 24" className="h-6 w-28 text-noir/70">
                <path
                  d={
                    party === "Licensor"
                      ? "M2 18c10-14 18-14 22-4s10 6 16-4 12-6 14 2 12 4 20-6 18 2 30 4"
                      : "M2 16c8-10 16-12 20-2s14 4 18-6 10-4 16 4 14 2 22-6 16 4 24 2"
                  }
                  stroke="currentColor"
                  strokeWidth="1.4"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
              <div className="mt-1 h-px bg-noir/30" />
              <p className="mt-1.5 text-[0.55rem] uppercase tracking-[0.24em] text-noir/55">
                {party}
              </p>
            </div>
          ))}
        </div>

        <Seal className="absolute -bottom-12 -right-8 h-32 w-32 rotate-[14deg] drop-shadow-[0_18px_30px_rgb(0_0_0/0.55)] sm:h-36 sm:w-36" />
      </div>

      {/* Review note */}
      <div className="absolute -left-4 top-0 flex items-center gap-3 border border-noir-line bg-noir-raised/90 px-4 py-3 shadow-float backdrop-blur motion-safe:animate-float sm:-left-10">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-gold-foil text-noir">
          <Icon icon={Check} size="sm" />
        </span>
        <span>
          <span className="block font-display text-sm text-ivory">
            Reviewed by an advocate
          </span>
          <span className="block text-[0.65rem] uppercase tracking-[0.18em] text-ivory/50">
            2 clauses refined
          </span>
        </span>
      </div>

      {/* Ready notification */}
      <div className="absolute -bottom-2 -left-2 flex max-w-[17rem] items-start gap-3 bg-ivory px-4 py-3 text-noir shadow-float motion-safe:animate-float-delayed sm:-left-12">
        <span className="grid h-9 w-9 shrink-0 place-items-center bg-noir text-brand">
          <Icon icon={Bell} size="sm" />
        </span>
        <span>
          <span className="block text-sm font-semibold">
            Your document is ready
          </span>
          <span className="block text-xs text-noir/60">
            Word + PDF · tap to download
          </span>
        </span>
      </div>
    </div>
  );
}
