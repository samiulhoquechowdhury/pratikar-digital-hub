"use client";

import { Alert, Badge, Loading, PageBody, PageHeader } from "@pratikar/ui";
import Link from "next/link";
import { useParams } from "next/navigation";

import { TemplateForm, useTemplate } from "@/features/templates";
import { RequireStaff } from "@/shared/components/RequireStaff";

const STATUS_TONE = {
  PUBLISHED: "success",
  DRAFT: "warning",
  ARCHIVED: "neutral",
} as const;

const BackLink = () => (
  <Link
    href="/templates"
    className="text-sm font-medium text-primary hover:text-primary-hover"
  >
    <span aria-hidden>←</span> All templates
  </Link>
);

function EditTemplate({ id }: { id: string }) {
  const { template, isLoading, error } = useTemplate(id);

  if (isLoading) {
    return (
      <PageBody>
        <Loading label="Loading template…" />
      </PageBody>
    );
  }

  if (error || !template) {
    return (
      <PageBody>
        <Alert tone="danger" role="alert">
          {error ?? "Template not found."}
        </Alert>
      </PageBody>
    );
  }

  return (
    <>
      <PageHeader title={template.title} actions={<BackLink />} />
      <PageBody className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone={STATUS_TONE[template.status]}>{template.status}</Badge>
          {template.status === "PUBLISHED" && (
            <span className="text-sm text-ink-muted">
              Live in the customer catalogue — edits take effect immediately.
            </span>
          )}
        </div>

        <TemplateForm existing={template} />
      </PageBody>
    </>
  );
}

export default function EditTemplatePage() {
  const params = useParams<{ id: string }>();

  return (
    <RequireStaff>
      <EditTemplate id={params.id} />
    </RequireStaff>
  );
}
