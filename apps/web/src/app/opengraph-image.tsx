import { OG_SIZE, renderOgCard } from "@/shared/lib/ogCard";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Pratikar Digital Hub — legal documents, courses and guides";

/** The share card for every page that doesn't have one of its own. */
export default function Image() {
  return renderOgCard({
    kind: "Har Ghar Mein Kanooni Gyaan",
    title: "Legal knowledge in every home.",
  });
}
