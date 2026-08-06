import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "AI legal assistant",
  description:
    "What the Pratikar AI assistant will do, and what you can use today.",
};

/**
 * The destination behind the header's "Ask AI" button.
 *
 * There is no assistant yet — it's Milestone 4, and the module in the API is
 * still a folder scaffold. This page says so plainly rather than showing a
 * chat box that can't answer, because on a legal site an assistant that
 * appears to work and doesn't is worse than one that isn't there.
 */
const PLANNED = [
  {
    title: "Find the right document",
    body: "Describe your situation in your own words — 'my tenant is three months behind' — and get pointed at the template that fits, instead of guessing from a list.",
  },
  {
    title: "Fill it in by conversation",
    body: "Answer questions one at a time instead of facing a long form. The same field schema that drives the manual form drives the conversation, so nothing is lost either way.",
  },
  {
    title: "Answer questions from our material",
    body: "Grounded in the templates, courses, and guides on this site — with a link to where each answer came from, so you can read the source yourself.",
  },
];

const AVAILABLE_NOW = [
  {
    href: "/documents",
    label: "Browse document templates",
    hint: "Search by name and fill in the form yourself",
  },
  {
    href: "/courses",
    label: "Take a certificate course",
    hint: "Video courses with a verifiable certificate",
  },
  {
    href: "/content-library",
    label: "Read a guide or checklist",
    hint: "E-books and reference sheets you can keep",
  },
];

export default function AssistantPage() {
  return (
    <>
      <section className="bg-hero-navy">
        <div className="mx-auto max-w-shell px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand">
            In development
          </span>
          <h1 className="mt-5 max-w-2xl text-4xl text-ink-inverse">
            An assistant that speaks plain language
          </h1>
          <p className="mt-4 max-w-prose text-base leading-relaxed text-ink-inverse-muted">
            The AI assistant isn&apos;t live yet. Here&apos;s what it will do
            when it is — and what you can already use today.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-shell px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-2xl">What it will do</h2>
        <ul className="mt-8 grid gap-6 sm:grid-cols-3">
          {PLANNED.map((item) => (
            <li
              key={item.title}
              className="rounded-card border border-line bg-surface p-6 shadow-card"
            >
              <h3 className="text-base">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                {item.body}
              </p>
            </li>
          ))}
        </ul>

        <p className="mt-8 max-w-prose text-sm leading-relaxed text-ink-muted">
          It will point you at material and help you complete a form. It
          won&apos;t give legal advice, and it won&apos;t replace the lawyer
          review you can add to any generated document.
        </p>
      </section>

      <section className="border-t border-line bg-canvas">
        <div className="mx-auto max-w-shell px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="text-2xl">What you can use today</h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-3">
            {AVAILABLE_NOW.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex h-full flex-col rounded-card border border-line bg-surface p-6 transition-shadow hover:shadow-raised"
                >
                  <span className="text-base font-semibold text-ink">
                    {item.label}
                  </span>
                  <span className="mt-2 flex-1 text-sm text-ink-muted">
                    {item.hint}
                  </span>
                  <span
                    aria-hidden
                    className="mt-4 text-sm font-semibold text-primary"
                  >
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
