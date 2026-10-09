import type { Metadata } from "next";

import { LegalPage, PRIVACY_INTRO, PRIVACY_SECTIONS } from "@/features/legal";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "What personal data Pratikar Digital Hub collects, why, who handles it, and your rights under the DPDP Act, 2023.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro={PRIVACY_INTRO}
      sections={PRIVACY_SECTIONS}
    />
  );
}
