"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { TemplateForm, useTemplate } from "@/features/templates";
import { RequireStaff } from "@/shared/components/RequireStaff";

function EditTemplate({ id }: { id: string }) {
  const { template, isLoading, error } = useTemplate(id);

  if (isLoading) return <p>Loading template…</p>;
  if (error) return <p role="alert">{error}</p>;
  if (!template) return <p role="alert">Template not found.</p>;

  return (
    <>
      <h1>{template.title}</h1>
      <p>
        {template.status}
        {template.status === "PUBLISHED" && " — live in the customer catalogue"}
      </p>
      <TemplateForm existing={template} />
    </>
  );
}

export default function EditTemplatePage() {
  const params = useParams<{ id: string }>();

  return (
    <RequireStaff>
      <main>
        <p>
          <Link href="/templates">← Templates</Link>
        </p>
        <EditTemplate id={params.id} />
      </main>
    </RequireStaff>
  );
}
