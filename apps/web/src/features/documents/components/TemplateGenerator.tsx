"use client";

import { Alert, ButtonLink, EmptyState, SkeletonForm } from "@pratikar/ui";
import { grossPaise } from "@pratikar/utils";
import { CheckCircle2 } from "lucide-react";
import { usePathname } from "next/navigation";

import { Icon } from "@/shared/components/Icon";
import {
  Breadcrumbs,
  ProductHeading,
  ProductLayout,
  ProductSection,
  PurchaseCard,
} from "@/shared/components/ProductPage";
import { formatPrice } from "@/shared/lib/format";
import { templateCategoryLabel } from "@/shared/lib/labels";
import { useAuth } from "@/shared/providers/AuthProvider";

import { useGenerateDocument } from "../hooks/useGenerateDocument";
import { useTemplate } from "../hooks/useTemplate";

import { DynamicTemplateForm } from "./DynamicTemplateForm";
import { GeneratedDocumentActions } from "./GeneratedDocumentActions";

/**
 * The flow as it actually runs: generating is free, payment unlocks the
 * download. There is no preview step — a preview PDF is produced but never
 * shown to the customer — so none is promised here.
 */
const STEPS = [
  {
    title: "Answer the questions",
    body: "Plain language, one field at a time. Generating is free.",
  },
  {
    title: "Pay for the document",
    body: "One price, GST included. Add a lawyer's review if you want one.",
  },
  {
    title: "Download it",
    body: "Word and PDF, ready to print and sign. One download, so keep the files safe.",
  },
];

interface TemplateGeneratorProps {
  templateId: string;
}

/**
 * A template's page: what the document is, what you'll be asked, and — once
 * signed in — the form itself.
 *
 * Public, so a visitor can see exactly what they'd be answering before they
 * make an account. The form stays behind sign-in because the answers are
 * saved to the account the document belongs to.
 */
export function TemplateGenerator({ templateId }: TemplateGeneratorProps) {
  const { user, isRestoring } = useAuth();
  const pathname = usePathname();
  const { template, isLoading, error: templateError } = useTemplate(templateId);
  const {
    generate,
    isSubmitting,
    error: generateError,
    result,
  } = useGenerateDocument(templateId);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-shell px-4 py-12 sm:px-6 lg:px-8">
        <SkeletonForm fields={5} label="Loading this template…" />
      </div>
    );
  }

  if (templateError || !template) {
    return (
      <div className="mx-auto max-w-shell px-4 py-12 sm:px-6 lg:px-8">
        <EmptyState
          title="This template isn't available"
          description="It may have been unpublished, or the link may be wrong."
          action={<ButtonLink href="/documents">All templates</ButtonLink>}
        />
      </div>
    );
  }

  const questions = template.fieldSchema.length;

  const priceCard = (
    <PurchaseCard>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-semibold tabular-nums text-ink">
          {formatPrice(grossPaise(template.priceInPaise))}
        </span>
        <span className="text-sm text-ink-subtle">incl. GST</span>
      </div>
      <p className="mt-2 text-sm text-ink-muted">
        Generating is free — you pay before downloading.
        {template.reviewPriceInPaise > 0 &&
          ` Lawyer review ${formatPrice(
            grossPaise(template.reviewPriceInPaise),
          )} extra, if you want one.`}
      </p>

      <ol className="mt-6 space-y-4">
        {STEPS.map((step, index) => (
          <li key={step.title} className="flex gap-3">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary-subtle text-xs font-semibold text-primary">
              {index + 1}
            </span>
            <div>
              <p className="text-sm font-medium text-ink">{step.title}</p>
              <p className="text-sm text-ink-muted">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      {!user && (
        <ButtonLink
          href={`/login?next=${encodeURIComponent(pathname)}`}
          className={`mt-6 w-full ${isRestoring ? "pointer-events-none opacity-60" : ""}`}
        >
          Sign in to start
        </ButtonLink>
      )}
    </PurchaseCard>
  );

  return (
    <ProductLayout
      header={
        <>
          <Breadcrumbs
            trail={[{ href: "/documents", label: "Documents" }]}
            current={template.title}
          />

          <ProductHeading
            kind="document"
            title={template.title}
            description="Answer a few plain-language questions and get the finished document as a Word file and a PDF, ready to print and sign."
            meta={[
              templateCategoryLabel(template.category),
              `${questions} ${questions === 1 ? "question" : "questions"}`,
              "Word + PDF",
            ]}
          />
        </>
      }
      aside={priceCard}
    >
      {result ? (
        <ProductSection title="Your document">
          <div className="space-y-6">
            <Alert tone="success" role="status">
              <span className="flex items-start gap-2">
                <Icon icon={CheckCircle2} className="mt-0.5" />
                Your document is being prepared. Filling and PDF conversion take
                a moment, so give it a few seconds if the download isn&apos;t
                ready straight away.
              </span>
            </Alert>
            <GeneratedDocumentActions
              documentId={result.id}
              template={template}
              initialStatus={result.status}
            />
          </div>
        </ProductSection>
      ) : user ? (
        <div className="mt-12">
          <DynamicTemplateForm
            template={template}
            onSubmit={generate}
            isSubmitting={isSubmitting}
            error={generateError}
          />
        </div>
      ) : (
        <ProductSection title="What you'll be asked">
          {questions > 0 ? (
            <ol className="divide-y divide-line rounded-card border border-line">
              {template.fieldSchema.map((field, index) => (
                <li
                  key={field.key}
                  className="flex items-center gap-4 px-5 py-3.5 text-base"
                >
                  <span className="w-6 shrink-0 text-sm tabular-nums text-ink-subtle">
                    {index + 1}
                  </span>
                  <span className="flex-1 text-ink">{field.label}</span>
                  {!field.required && (
                    <span className="text-sm text-ink-subtle">Optional</span>
                  )}
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-ink-muted">
              Nothing to fill in — the document is ready as it is.
            </p>
          )}
        </ProductSection>
      )}
    </ProductLayout>
  );
}
