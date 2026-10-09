import { ButtonLink } from "@pratikar/ui";
import type { Metadata } from "next";

import { FaqList, type FaqGroup } from "@/features/faq/components/FaqList";
import { JsonLd } from "@/shared/components/JsonLd";
import { PageIntro, PageSection } from "@/shared/components/PageIntro";
import { dataOf, serverGet } from "@/shared/lib/serverApi";

export const metadata: Metadata = {
  title: "Frequently asked questions",
  description:
    "How documents, downloads, advocate review, payments, GST invoices and accounts work on Pratikar Digital Hub.",
  alternates: { canonical: "/faq" },
};

export default async function FaqPage() {
  const groups = dataOf(await serverGet<FaqGroup[]>("/faq")) ?? [];
  const items = groups.flatMap((group) => group.items);

  return (
    <>
      {/* schema.org FAQPage, so search engines can show the answers. */}
      {items.length > 0 && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: items.map((item) => ({
              "@type": "Question",
              name: item.question,
              acceptedAnswer: { "@type": "Answer", text: item.answer },
            })),
          }}
        />
      )}
      <PageIntro
        eyebrow="Help"
        title="Frequently asked questions"
        description="How documents, payments and your account work. Can't find your answer? Ask the AI assistant, or contact us."
      />
      <PageSection className="pb-12">
        <div className="max-w-3xl">
          {items.length === 0 ? (
            <p className="text-sm text-ink-muted">
              Questions will appear here soon. Meanwhile, the AI assistant can
              help, or you can contact us.
            </p>
          ) : (
            <FaqList groups={groups} />
          )}
          <div className="mt-10 flex flex-wrap gap-3">
            <ButtonLink href="/assistant">Ask the AI assistant</ButtonLink>
            <ButtonLink href="/contact" variant="secondary">
              Contact us
            </ButtonLink>
          </div>
        </div>
      </PageSection>
    </>
  );
}
