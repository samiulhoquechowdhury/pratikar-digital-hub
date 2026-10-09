import type { Metadata } from "next";

import { AssistantChat } from "@/features/assistant";
import { PageIntro } from "@/shared/components/PageIntro";

export const metadata: Metadata = {
  title: "AI legal assistant",
  description:
    "Describe your situation and the Pratikar assistant finds the right course, document, legal form or e-book — or sets up a custom draft reviewed by an advocate.",
};

/**
 * The destination behind the header's "Ask AI" button: the same assistant as
 * the floating panel, given the page to itself, with its limits spelled out
 * underneath — on a legal site, what it won't do matters as much as what it
 * does.
 */
const LIMITS = [
  {
    title: "What it does",
    body: "Reads everything on this site — courses, document templates, legal forms, checklists and e-books — and recommends what fits your situation, with prices.",
  },
  {
    title: "When nothing fits",
    body: "It sets up a custom document: the AI drafts it from your description, an advocate reviews it, and then it's yours to download.",
  },
  {
    title: "What it won't do",
    body: "Give legal advice about your own case. For that, send your document for an advocate's review.",
  },
];

export default function AssistantPage() {
  return (
    <>
      <PageIntro
        eyebrow="Ask AI"
        title="Tell us what you're dealing with"
        description="Describe it in your own words, in any language. The assistant answers from what this site offers, and shows you exactly where to go next."
      />

      <section className="mx-auto max-w-shell px-4 pb-12 sm:px-6 lg:px-8">
        <div className="max-w-4xl">
          <AssistantChat />
        </div>
      </section>

      <section className="mx-auto max-w-shell px-4 sm:px-6 lg:px-8">
        <div className="rounded-card bg-surface-sunken px-6 py-10 sm:px-10">
          <ul className="grid gap-8 sm:grid-cols-3">
            {LIMITS.map((item) => (
              <li key={item.title}>
                <h2 className="text-base font-semibold">{item.title}</h2>
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
