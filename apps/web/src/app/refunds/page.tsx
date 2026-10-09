import type { Metadata } from "next";

import { LegalPage, REFUNDS_INTRO, REFUND_SECTIONS } from "@/features/legal";

export const metadata: Metadata = {
  title: "Cancellation & Refund Policy",
  description:
    "When purchases on Pratikar Digital Hub can be cancelled or refunded, and how refunds are paid.",
};

export default function RefundsPage() {
  return (
    <LegalPage
      title="Cancellation & Refunds"
      intro={REFUNDS_INTRO}
      sections={REFUND_SECTIONS}
    />
  );
}
