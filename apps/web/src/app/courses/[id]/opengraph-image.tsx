import type { Course } from "@pratikar/types";
import { grossPaise } from "@pratikar/utils";

import { formatPrice } from "@/shared/lib/format";
import { OG_SIZE, renderOgCard } from "@/shared/lib/ogCard";
import { dataOf, serverGet } from "@/shared/lib/serverApi";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Certificate course on Pratikar Digital Hub";

type Params = { id: string };

export default async function Image({
  params,
}: {
  params: Params | Promise<Params>;
}) {
  const { id } = await params;
  const course = dataOf(
    await serverGet<Course>(`/courses/catalogue/${encodeURIComponent(id)}`),
  );
  return renderOgCard({
    kind: "Certificate course",
    title: course?.title ?? "Learn it properly, prove it",
    price: course
      ? `${formatPrice(grossPaise(course.priceInPaise))} incl. GST`
      : undefined,
  });
}
