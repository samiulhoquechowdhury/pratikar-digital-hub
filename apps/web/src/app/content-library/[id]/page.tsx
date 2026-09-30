import type { ContentLibraryItem } from "@pratikar/types";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ContentItemDetail } from "@/features/content-library";
import { JsonLd } from "@/shared/components/JsonLd";
import {
  libraryDescription,
  productMetadata,
  libraryJsonLd,
} from "@/shared/lib/seo";
import { dataOf, serverGet } from "@/shared/lib/serverApi";

interface ContentItemPageProps {
  params: Promise<{ id: string }>;
}

const load = (id: string) =>
  serverGet<ContentLibraryItem>(
    `/content-library/catalogue/${encodeURIComponent(id)}`,
  );

export async function generateMetadata({
  params,
}: ContentItemPageProps): Promise<Metadata> {
  const { id } = await params;
  const item = dataOf(await load(id));
  if (!item) return { title: "Library" };

  return productMetadata({
    title: item.title,
    description: libraryDescription(item),
    path: `/content-library/${id}`,
  });
}

// Rendered on the server so what the item is and what it costs are in the
// HTML; whether the visitor owns it is still checked in the browser. No
// <main>: the root layout already provides one.
export default async function ContentItemPage({
  params,
}: ContentItemPageProps) {
  const { id } = await params;
  const result = await load(id);
  if (result.status === "missing") notFound();
  const item = dataOf(result);

  return (
    <>
      {item && <JsonLd data={libraryJsonLd(item)} />}
      <ContentItemDetail itemId={id} initialItem={item} />
    </>
  );
}
