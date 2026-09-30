import { FileWarning } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { Icon } from "@/shared/components/Icon";
import { PageIntro, PageSection } from "@/shared/components/PageIntro";
import {
  companyDetails,
  missingCompanyDetails,
  PLACEHOLDERS,
  type CompanyDetails,
} from "@/shared/lib/company";
import { LEGAL_PAGES } from "@/shared/lib/navigation";

export interface LegalSection {
  /** Anchor, so a section can be linked to directly ("/refunds#courses"). */
  id: string;
  title: string;
  body: ReactNode;
}

/**
 * One of the business's details, or a highlighted placeholder where it has
 * not been filled in yet — so a missing address reads as missing, not as a
 * sentence that happens to have a gap in it.
 */
export function Detail({ field }: { field: keyof CompanyDetails }) {
  const value = companyDetails()[field].trim();
  if (value) return <>{value}</>;
  return (
    <mark className="rounded bg-warning-subtle px-1 font-medium text-warning-text">
      [{PLACEHOLDERS[field]}]
    </mark>
  );
}

/**
 * Shown while any of the business's details are still blank. The pages
 * describe how the site works today, but until the details are in and a
 * lawyer has read them they are a draft, and they say so.
 */
export function DraftNotice() {
  if (missingCompanyDetails().length === 0) return null;
  return (
    <div
      role="note"
      className="mb-10 flex gap-3 rounded-card border border-warning-border bg-warning-subtle p-4 text-sm text-warning-text"
    >
      <Icon icon={FileWarning} size="md" className="shrink-0" />
      <p>
        <strong>Draft — pending legal review.</strong> The highlighted details
        are still to be filled in, and the wording has not yet been confirmed by
        a lawyer. It describes how the site works today and is not final.
      </p>
    </div>
  );
}

/**
 * The layout every legal page shares: title, a contents list, and the
 * sections at a readable width.
 *
 * Server-rendered and static on purpose — these are pages a payment provider,
 * a regulator or a search engine reads, and none of them should depend on
 * JavaScript to see the text.
 */
export function LegalPage({
  title,
  intro,
  sections,
}: {
  title: string;
  intro: ReactNode;
  sections: LegalSection[];
}) {
  return (
    <>
      <PageIntro
        eyebrow="Legal"
        title={title}
        description={
          <>
            Last updated: <Detail field="policiesUpdatedOn" />
          </>
        }
      />

      <PageSection className="pb-8">
        <DraftNotice />

        <div className="grid gap-12 lg:grid-cols-[14rem_minmax(0,1fr)]">
          {/* Desktop only: on a phone it pushed the policy itself a full
              screen down, and every policy is also linked in the footer. */}
          <nav
            aria-label="On this page"
            className="hidden lg:sticky lg:top-24 lg:block lg:self-start"
          >
            <p className="text-sm font-semibold text-ink">On this page</p>
            <ol className="mt-3 space-y-2 border-l border-line text-sm">
              {sections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="-ml-px block border-l border-transparent pl-4 text-ink-muted transition-colors hover:border-line-strong hover:text-ink"
                  >
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>

            <p className="mt-8 text-sm font-semibold text-ink">
              Other policies
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              {LEGAL_PAGES.filter((page) => page.label !== title).map(
                (page) => (
                  <li key={page.href}>
                    <Link
                      href={page.href}
                      className="text-ink-muted transition-colors hover:text-ink"
                    >
                      {page.label}
                    </Link>
                  </li>
                ),
              )}
            </ul>
          </nav>

          <article className="prose-legal max-w-prose">
            <div className="text-lg leading-relaxed text-ink-muted">
              {intro}
            </div>
            {sections.map((section) => (
              <section
                key={section.id}
                id={section.id}
                // Clears the sticky header when jumped to from the contents.
                className="scroll-mt-24"
              >
                <h2 className="mt-12 text-xl font-semibold text-ink">
                  {section.title}
                </h2>
                <div className="mt-4">{section.body}</div>
              </section>
            ))}
          </article>
        </div>
      </PageSection>
    </>
  );
}
