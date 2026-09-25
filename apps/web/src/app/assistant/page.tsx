import type { Metadata } from "next";

import { AssistantChat } from "@/features/assistant";

export const metadata: Metadata = {
  title: "AI legal assistant",
  description:
    "A preview of the Pratikar assistant, with scripted answers about our documents, courses and guides.",
};

/**
 * The destination behind the header's "Ask AI" button.
 *
 * ── A DELIBERATE REVERSAL ─────────────────────────────────────────────────
 * This page used to be a description of a chat that didn't exist, and argued
 * that showing a chat box which can't answer is worse than showing none. The
 * interface is now here, ahead of the model, so the conversation design can
 * be settled and demonstrated before Milestone 4 builds retrieval behind it.
 *
 * The original concern was right and has not gone away, so it is answered in
 * the build rather than dismissed: every reply is scripted, the preview
 * labelling is persistent rather than a dismissible notice, unmatched
 * questions say plainly that they can't be answered instead of improvising,
 * and nothing in the script gives advice. What stays is the boundary — it
 * points at material, and it is not a substitute for the lawyer review.
 */
const LIMITS = [
  {
    title: "What it does here",
    body: "Answers a handful of scripted questions about our templates, courses and guides, and links you to the page behind each one.",
  },
  {
    title: "What it will do",
    body: "Search everything on this site and show where each answer came from — plus fill a document in by conversation instead of a long form.",
  },
  {
    title: "What it won't do",
    body: "Give legal advice, or replace the lawyer review you can add to any document you generate.",
  },
];

export default function AssistantPage() {
  return (
    <>
      <section data-surface="inverse" className="bg-hero-navy">
        <div className="mx-auto max-w-shell px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand">
            Preview
          </span>
          <h1 className="mt-5 max-w-2xl text-4xl text-ink-inverse">
            An assistant that speaks plain language
          </h1>
          <p className="mt-4 max-w-prose text-base leading-relaxed text-ink-inverse-muted">
            Try it below. The answers are scripted for now — the assistant that
            reads our whole library is still being built.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <AssistantChat />
      </section>

      <section className="border-t border-line bg-canvas">
        <div className="mx-auto max-w-shell px-4 py-12 sm:px-6 lg:px-8">
          <ul className="grid gap-6 sm:grid-cols-3">
            {LIMITS.map((item) => (
              <li key={item.title}>
                <h2 className="text-base">{item.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                  {item.body}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
