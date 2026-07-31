"use client";

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
      <p>
        <Link href="/login">Sign in</Link> to generate a document.
      </p>
    );
  }

  if (isLoading) return <p>Loading template…</p>;
  if (templateError || !template)
    return <p role="alert">{templateError ?? "Template not found."}</p>;

  if (result) {
    return (
      <div>
        <h2>{template.title}</h2>
        <p>
          Your document has been generated. Filling and PDF conversion run in a
          background job, so give it a moment if the download isn&apos;t ready
          straight away.
        </p>
        <GeneratedDocumentActions
          documentId={result.id}
          template={template}
          initialStatus={result.status}
        />
      </div>
    );
  }

  return (
    <DynamicTemplateForm
      template={template}
      onSubmit={generate}
      isSubmitting={isSubmitting}
      error={generateError}
    />
  );
}
