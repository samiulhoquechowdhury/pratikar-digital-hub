import { TemplateGenerator } from "@/features/documents";

interface DocumentTemplatePageProps {
  params: Promise<{ id: string }>;
}

// The template's own title is the heading, and it isn't known until the
// client component has loaded it — so the layout lives in the component. No
// <main> either: the root layout already provides one.
export default async function DocumentTemplatePage({
  params,
}: DocumentTemplatePageProps) {
  const { id } = await params;
  return <TemplateGenerator templateId={id} />;
}
