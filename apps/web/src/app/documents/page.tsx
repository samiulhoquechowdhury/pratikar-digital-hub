import { TemplateList } from "@/features/documents";
import { PageIntro, PageSection } from "@/shared/components/PageIntro";

export const metadata = { title: "Document templates" };

// No <main> here: the root layout already provides one, and nesting a second
// is invalid — screen readers announce two "main" landmarks and the skip link
// stops meaning anything.
export default function DocumentsPage() {
  return (
    <>
      <PageIntro
        eyebrow="Documents"
        title="Legal documents, ready to sign"
        description="Answer a few plain-language questions and get a finished document as a Word file and a PDF. Add a lawyer's review if you'd like a second pair of eyes."
      />
      <PageSection className="pb-8">
        <TemplateList />
      </PageSection>
    </>
  );
}
