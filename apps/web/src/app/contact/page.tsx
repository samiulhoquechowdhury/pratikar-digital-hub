import type { Metadata } from "next";

import { ContactPage } from "@/features/legal";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact Pratikar Digital Hub about an order, a refund, a document or a course.",
};

export default function Contact() {
  return <ContactPage />;
}
