import { ContentLibraryList } from "@/features/content-library";
import { PageBody, PageHeader } from "@/shared/components/ui";

export const metadata = { title: "Content library" };

export default function ContentLibraryPage() {
  return (
    <>
      <PageHeader
        title="Content library"
        description="E-books and checklists you can buy once and download whenever you need them."
      />
      <PageBody>
        <ContentLibraryList />
      </PageBody>
    </>
  );
}
