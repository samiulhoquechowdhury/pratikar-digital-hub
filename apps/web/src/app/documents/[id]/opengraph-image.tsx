import type { Template } from "@pratikar/types";
import { grossPaise } from "@pratikar/utils";

import { formatPrice } from "@/shared/lib/format";
import { OG_SIZE, renderOgCard } from "@/shared/lib/ogCard";
import { dataOf, serverGet } from "@/shared/lib/serverApi";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Document template on Pratikar Digital Hub";

type Params = { id: string };

export default async function Image({
  params,
}: {
  params: Params | Promise<Params>;
}) {
  const { id } = await params;
  const template = dataOf(
    await serverGet<Template>(
      `/documents/templates/catalogue/${encodeURIComponent(id)}`,
    ),
  );
  return renderOgCard({
    kind: "Document template",
    title: template?.title ?? "Legal documents, ready to sign",
    price: template
      ? `${formatPrice(grossPaise(template.priceInPaise))} incl. GST`
      : undefined,
  });
}
