import type { Metadata } from "next";

import { DELIVERY_INTRO, DELIVERY_SECTIONS, LegalPage } from "@/features/legal";

export const metadata: Metadata = {
  title: "Delivery Policy",
  description:
    "How and when documents, courses, library items and invoices bought on Pratikar Digital Hub are delivered.",
};

export default function DeliveryPage() {
  return (
    <LegalPage
      title="Delivery Policy"
      intro={DELIVERY_INTRO}
      sections={DELIVERY_SECTIONS}
    />
  );
}
