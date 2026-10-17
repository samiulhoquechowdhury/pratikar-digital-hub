"use client";

import {
  ArrowUpRight,
  Briefcase,
  GraduationCap,
  House,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useId, useRef, useState } from "react";

import { Icon } from "@/shared/components/Icon";

type Tag = "Template" | "AI draft" | "Form" | "Checklist" | "E-book" | "Course";

interface UseCase {
  title: string;
  body: string;
  tag: Tag;
  href: string;
}

interface Audience {
  id: string;
  label: string;
  icon: LucideIcon;
  headline: string;
  body: string;
  cases: UseCase[];
}

const search = (q: string) => `/search?q=${encodeURIComponent(q)}`;
const draft = (type: string) =>
  `/documents/custom?type=${encodeURIComponent(type)}`;

/**
 * Who it's for, and what each of them comes for. Every card is a real way
 * in — a search, or AI drafting with the document type filled in — never a
 * page that doesn't exist.
 */
const AUDIENCES: Audience[] = [
  {
    id: "families",
    label: "Families",
    icon: Users,
    headline: "The paperwork life hands you",
    body: "Name changes, wills, gifts and inheritance — the documents most families need once, and need right.",
    cases: [
      {
        title: "Affidavit for a name change",
        body: "After marriage, or to fix a spelling.",
        tag: "Form",
        href: search("Name change affidavit"),
      },
      {
        title: "A simple will",
        body: "Say who gets what, in words that hold up.",
        tag: "AI draft",
        href: draft("Will"),
      },
      {
        title: "Gift deed for property",
        body: "Passing a flat or land to family.",
        tag: "AI draft",
        href: draft("Gift deed"),
      },
      {
        title: "Inheritance, step by step",
        body: "What to file after someone passes away.",
        tag: "Checklist",
        href: search("Succession"),
      },
    ],
  },
  {
    id: "rent",
    label: "Landlords & tenants",
    icon: House,
    headline: "Renting, without the arguments",
    body: "Put the deal in writing before the keys change hands — and know what to send when it goes wrong.",
    cases: [
      {
        title: "Rent agreement",
        body: "An 11-month leave and licence, filled in by chat.",
        tag: "Template",
        href: search("Rent agreement"),
      },
      {
        title: "Notice for unpaid rent",
        body: "A formal demand before anything else.",
        tag: "AI draft",
        href: draft("Legal notice for unpaid rent"),
      },
      {
        title: "Before you sign a lease",
        body: "Deposit, lock-in, maintenance, registration.",
        tag: "Checklist",
        href: search("Lease checklist"),
      },
      {
        title: "Tenant police verification",
        body: "The form your city asks landlords for.",
        tag: "Form",
        href: search("Police verification"),
      },
    ],
  },
  {
    id: "business",
    label: "Small businesses",
    icon: Briefcase,
    headline: "Run the business, not the paperwork",
    body: "Hiring, partners, clients and GST — the agreements a growing business signs every month.",
    cases: [
      {
        title: "Employment offer letter",
        body: "Role, pay and joining date, ready to send.",
        tag: "Template",
        href: search("Offer letter"),
      },
      {
        title: "Non-disclosure agreement",
        body: "Before you share the idea, the client list or the code.",
        tag: "AI draft",
        href: draft("Non-disclosure agreement"),
      },
      {
        title: "Partnership deed",
        body: "Shares, capital, and how a partner exits.",
        tag: "AI draft",
        href: draft("Partnership deed"),
      },
      {
        title: "GST, explained",
        body: "Registration and returns in plain words.",
        tag: "E-book",
        href: search("GST"),
      },
    ],
  },
  {
    id: "students",
    label: "Law students & advocates",
    icon: GraduationCap,
    headline: "Formats and practice, ready to hand",
    body: "Court formats, drafting guides and short courses — for the people who draft for everyone else.",
    cases: [
      {
        title: "Bail application format",
        body: "The standard structure, ready to adapt.",
        tag: "Form",
        href: search("Bail application"),
      },
      {
        title: "Legal notice formats",
        body: "Recovery, cheque bounce, defamation and more.",
        tag: "Form",
        href: search("Legal notice"),
      },
      {
        title: "Drafting handbooks",
        body: "How agreements are actually put together.",
        tag: "E-book",
        href: search("Drafting"),
      },
      {
        title: "Courses with a certificate",
        body: "Short lessons and a code employers can check.",
        tag: "Course",
        href: "/courses",
      },
    ],
  },
];

/**
 * Jasper's "by role" section: pick who you are, see what people like you
 * come here for. Tabs follow the ARIA pattern — arrow keys move between
 * them, and only the selected tab is in the tab order.
 */
export function Audiences() {
  const [activeId, setActiveId] = useState(AUDIENCES[0]!.id);
  const baseId = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const active =
    AUDIENCES.find((audience) => audience.id === activeId) ?? AUDIENCES[0]!;

  const onTabKey = (event: React.KeyboardEvent, index: number) => {
    const step =
      event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const next = (index + step + AUDIENCES.length) % AUDIENCES.length;
    setActiveId(AUDIENCES[next]!.id);
    tabRefs.current[next]?.focus();
  };

  return (
    <section
      aria-labelledby={`${baseId}-title`}
      className="border-t border-ivory-line bg-ivory"
    >
      <div className="mx-auto max-w-shell px-4 py-28 sm:px-6 sm:py-36 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="flex items-center justify-center gap-4">
            <span className="font-display text-lg italic text-brand">06</span>
            <span aria-hidden className="h-px w-10 bg-noir/20" />
            <span className="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-noir/55">
              Who it&apos;s for
            </span>
          </p>
          <h2
            id={`${baseId}-title`}
            className="mt-6 text-4xl font-light leading-[1.04] text-noir sm:text-6xl"
          >
            Made for the people{" "}
            <span className="accent-serif">behind the paperwork.</span>
          </h2>
        </div>

        <div
          role="tablist"
          aria-label="Who you are"
          className="relative mx-auto mt-14 flex w-fit max-w-full gap-8 overflow-x-auto border-b border-noir/15"
        >
          {AUDIENCES.map((audience, index) => {
            const selected = audience.id === active.id;
            return (
              <button
                key={audience.id}
                ref={(node) => {
                  tabRefs.current[index] = node;
                }}
                type="button"
                role="tab"
                id={`${baseId}-tab-${audience.id}`}
                aria-selected={selected}
                aria-controls={`${baseId}-panel`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActiveId(audience.id)}
                onKeyDown={(event) => onTabKey(event, index)}
                className={`relative inline-flex shrink-0 items-center gap-2 pb-4 text-[0.7rem] font-semibold uppercase tracking-[0.22em] transition-colors ${
                  selected ? "text-noir" : "text-noir/45 hover:text-noir/80"
                }`}
              >
                <span
                  aria-hidden
                  className={`absolute inset-x-0 -bottom-px h-0.5 origin-left bg-noir transition-transform duration-500 ${
                    selected ? "scale-x-100" : "scale-x-0"
                  }`}
                />
                {audience.label}
              </button>
            );
          })}
        </div>

        <div
          role="tabpanel"
          id={`${baseId}-panel`}
          aria-labelledby={`${baseId}-tab-${active.id}`}
          className="mt-14 grid grid-cols-[minmax(0,1fr)] gap-px border border-noir/10 bg-noir/10 lg:grid-cols-[1fr_2fr]"
        >
          <div
            data-surface="inverse"
            className="relative flex flex-col overflow-hidden bg-noir-glow p-8 text-ivory sm:p-12"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-[radial-gradient(closest-side,rgb(212_175_55/0.2),transparent)]"
            />
            <span className="relative grid h-14 w-14 place-items-center rounded-full border border-brand/60 text-brand">
              <Icon icon={active.icon} size="lg" />
            </span>
            <h3 className="relative mt-auto pt-16 font-display text-4xl font-light leading-tight text-ivory">
              {active.headline}
            </h3>
            <p className="relative mt-4 text-base leading-relaxed text-ivory/65">
              {active.body}
            </p>
          </div>

          <ul className="grid gap-px bg-noir/10 sm:grid-cols-2">
            {active.cases.map((useCase) => (
              <li key={useCase.title}>
                <Link
                  href={useCase.href}
                  className="group flex h-full min-h-[13rem] flex-col bg-ivory p-8 transition-colors duration-500 hover:bg-noir"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-[0.6rem] font-semibold uppercase tracking-[0.24em] text-gold-ink group-hover:text-brand">
                      {useCase.tag}
                    </span>
                    <Icon
                      icon={ArrowUpRight}
                      className="text-noir/40 transition-[color,transform] duration-500 group-hover:rotate-45 group-hover:text-brand motion-reduce:transform-none"
                    />
                  </div>
                  <h4 className="mt-auto pt-10 font-display text-2xl font-light text-noir group-hover:text-ivory">
                    {useCase.title}
                  </h4>
                  <p className="mt-2 text-sm leading-relaxed text-noir/60 group-hover:text-ivory/65">
                    {useCase.body}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
