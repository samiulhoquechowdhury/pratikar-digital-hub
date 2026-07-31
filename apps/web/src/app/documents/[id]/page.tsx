import { PageBody } from "@pratikar/ui";

import { TemplateGenerator } from "@/features/documents";

interface DocumentTemplatePageProps {
  params: Promise<{ id: string }>;
}

// No PageHeader: the template's own title is the heading, and it isn't known
// until the client component has loaded it. No <main> either — the root layout
// already provides one.
export default async function DocumentTemplatePage({
  params,
}: DocumentTemplatePageProps) {
  const { id } = await params;

  return (
    <PageBody>
      <TemplateGenerator templateId={id} />
    </PageBody>
  );
}
