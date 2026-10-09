import type { Template } from "@pratikar/types";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { TemplateGenerator } from "@/features/documents";
import { JsonLd } from "@/shared/components/JsonLd";
import {
  templateDescription,
  productMetadata,
  templateJsonLd,
} from "@/shared/lib/seo";
import { dataOf, serverGet } from "@/shared/lib/serverApi";

interface DocumentTemplatePageProps {
  params: Promise<{ id: string }>;
}

// Called by both generateMetadata and the page; Next dedupes the identical
// fetch within one render, so the API is asked once.
const load = (id: string) =>
  serverGet<Template>(
    `/documents/templates/catalogue/${encodeURIComponent(id)}`,
  );

export async function generateMetadata({
  params,
}: DocumentTemplatePageProps): Promise<Metadata> {
  const { id } = await params;
  const template = dataOf(await load(id));
  if (!template) return { title: "Document template" };

  return productMetadata({
    title: template.title,
    description: templateDescription(template),
    path: `/documents/${id}`,
  });
}

// Rendered on the server so the template's title, questions and price are in
// the HTML a search engine or a link preview reads. No <main>: the root
// layout already provides one.
export default async function DocumentTemplatePage({
  params,
}: DocumentTemplatePageProps) {
  const { id } = await params;
  const result = await load(id);
  if (result.status === "missing") notFound();
  const template = dataOf(result);

  return (
    <>
      {template && <JsonLd data={templateJsonLd(template)} />}
      <TemplateGenerator templateId={id} initialTemplate={template} />
    </>
  );
}
