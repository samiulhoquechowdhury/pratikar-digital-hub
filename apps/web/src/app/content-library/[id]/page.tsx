import { ContentItemDetail } from "@/features/content-library";

interface ContentItemPageProps {
  params: Promise<{ id: string }>;
}

export default async function ContentItemPage({
  params,
}: ContentItemPageProps) {
  const { id } = await params;

  return (
    <main>
      <ContentItemDetail itemId={id} />
    </main>
  );
}
