import { TemplateGenerator } from "@/features/documents";

interface DocumentTemplatePageProps {
  params: Promise<{ id: string }>;
}

export default async function DocumentTemplatePage({
  params,
}: DocumentTemplatePageProps) {
  const { id } = await params;

  return (
    <main>
      <TemplateGenerator templateId={id} />
    </main>
  );
}
