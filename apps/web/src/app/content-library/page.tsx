import { ContentLibraryList } from "@/features/content-library";

export default function ContentLibraryPage() {
  return (
    <main>
      <h1>Content library</h1>
      <p>E-books and checklists you can buy and download.</p>
      <ContentLibraryList />
    </main>
  );
}
