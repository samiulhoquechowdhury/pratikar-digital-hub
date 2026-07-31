"use client";

import { Alert, ButtonLink, Card, EmptyState, Loading } from "@pratikar/ui";
import Link from "next/link";

import { useAuth } from "@/shared/providers/AuthProvider";

import { useGenerateDocument } from "../hooks/useGenerateDocument";
import { useTemplate } from "../hooks/useTemplate";

import { DynamicTemplateForm } from "./DynamicTemplateForm";
import { GeneratedDocumentActions } from "./GeneratedDocumentActions";

interface TemplateGeneratorProps {
  templateId: string;
}

// Composes template lookup + the dynamic form + document generation into one
// self-contained feature component, so app/documents/[id]/page.tsx stays a
// thin route wrapper per apps/web/src/features/README.md.
export function TemplateGenerator({ templateId }: TemplateGeneratorProps) {
  const { user } = useAuth();
  const {
    template,
    isLoading,
    error: templateError,
  } = useTemplate(templateId, !!user);
  const {
    generate,
    isSubmitting,
    error: generateError,
    result,
  } = useGenerateDocument(templateId);

  if (!user) {
    return (
      <EmptyState
        title="Sign in to generate a document"
        description="Your answers are saved to your account, so we need to know whose document this is."
        action={
          <ButtonLink href={`/login?next=/documents/${templateId}`}>
            Sign in
          </ButtonLink>
        }
      />
    );
  }

  if (isLoading) return <Loading label="Loading template…" />;

  if (templateError || !template) {
    return (
      <Alert tone="danger" role="alert">
        {templateError ?? "That template isn't available."}{" "}
        <Link href="/documents" className="font-semibold underline">
          Back to templates
        </Link>
      </Alert>
    );
  }

  if (result) {
    return (
      <div className="space-y-6">
        <Card className="p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <span
              aria-hidden
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-success-subtle text-lg text-success-text"
            >
              ✓
            </span>
            <div>
              <h2 className="text-xl">{template.title}</h2>
              <p className="mt-2 max-w-prose text-sm leading-relaxed text-ink-muted">
                Your document has been generated. Filling and PDF conversion run
                in a background job, so give it a moment if the download
                isn&apos;t ready straight away.
              </p>
            </div>
          </div>
        </Card>

        <GeneratedDocumentActions
          documentId={result.id}
          template={template}
          initialStatus={result.status}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/documents"
        className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-hover"
      >
        <span aria-hidden>←</span> All templates
      </Link>

      <DynamicTemplateForm
        template={template}
        onSubmit={generate}
        isSubmitting={isSubmitting}
        error={generateError}
      />
    </div>
  );
}
