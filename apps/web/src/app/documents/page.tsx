import { PageBody, PageHeader } from "@pratikar/ui";

import { TemplateList } from "@/features/documents";

export const metadata = { title: "Document templates" };

// No <main> here: the root layout already provides one, and nesting a second
// is invalid — screen readers announce two "main" landmarks and the skip link
// stops meaning anything.
export default function DocumentsPage() {
  return (
    <>
      <PageHeader
        title="Document templates"
        description="Answer a few plain-language questions and get a ready-to-sign document as a Word file and a PDF."
      />
      <PageBody>
        <TemplateList />
      </PageBody>
    </>
  );
}
