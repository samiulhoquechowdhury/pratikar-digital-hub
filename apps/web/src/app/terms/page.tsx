import type { Metadata } from "next";

import { LegalPage, TERMS_INTRO, TERMS_SECTIONS } from "@/features/legal";

export const metadata: Metadata = {
  title: "Terms of Use",
  description:
    "The terms for using Pratikar Digital Hub and buying document templates, courses and library items.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Use"
      intro={TERMS_INTRO}
      sections={TERMS_SECTIONS}
    />
  );
}
