import { PageBody } from "@pratikar/ui";

import { ContentItemDetail } from "@/features/content-library";

interface ContentItemPageProps {
  params: Promise<{ id: string }>;
}

// The item's own title is the heading, and it isn't known until the client
// component has loaded it — so no PageHeader. No <main> either: the root
// layout already provides one, and nesting a second is invalid.
export default async function ContentItemPage({
  params,
}: ContentItemPageProps) {
  const { id } = await params;

  return (
    <PageBody>
      <ContentItemDetail itemId={id} />
    </PageBody>
  );
}
