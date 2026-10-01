import type { ContentLibraryItem } from "@pratikar/types";
import { grossPaise } from "@pratikar/utils";

import { formatPrice } from "@/shared/lib/format";
import { OG_SIZE, renderOgCard } from "@/shared/lib/ogCard";
import { dataOf, serverGet } from "@/shared/lib/serverApi";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Library item on Pratikar Digital Hub";

const KIND = { EBOOK: "E-book", CHECKLIST: "Checklist", FORM: "Form" } as const;

type Params = { id: string };

export default async function Image({
  params,
}: {
  params: Params | Promise<Params>;
}) {
  const { id } = await params;
  const item = dataOf(
    await serverGet<ContentLibraryItem>(
      `/content-library/catalogue/${encodeURIComponent(id)}`,
    ),
  );
  return renderOgCard({
    kind: item ? KIND[item.type] : "Library",
    title: item?.title ?? "Guides, checklists and forms",
    price: item
      ? `${formatPrice(grossPaise(item.priceInPaise))} incl. GST`
      : undefined,
  });
}
