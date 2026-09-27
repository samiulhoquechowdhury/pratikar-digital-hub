import { ContentItemDetail } from "@/features/content-library";

interface ContentItemPageProps {
  params: Promise<{ id: string }>;
}

// The item's own title is the heading, and it isn't known until the client
// component has loaded it — so the layout lives in the component. No <main>
// either: the root layout already provides one.
export default async function ContentItemPage({
  params,
}: ContentItemPageProps) {
  const { id } = await params;
  return <ContentItemDetail itemId={id} />;
}
