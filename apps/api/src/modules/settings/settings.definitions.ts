import { Role } from "@pratikar/types";

/** The certificate's wording. Read publicly by the certificate page. */
export interface CertificateSettings {
  title: string;
  issuerName: string;
  /** Who signs it — blank prints no signature block. */
  signatoryName: string;
  signatoryTitle: string;
  /** A line under everything, e.g. an accreditation. Blank prints nothing. */
  footerNote: string;
}

export interface PricingSettings {
  /** The advocate review of a custom AI draft, in paise before GST. */
  customDraftReviewPricePaise: number;
}

export interface SettingValues {
  certificate: CertificateSettings;
  pricing: PricingSettings;
}

export type SettingKey = keyof SettingValues;

const CONTENT = [Role.CONTENT_MANAGER, Role.ADMIN, Role.SUPER_ADMIN];

/** Default review price when neither the setting nor the env var is set: ₹499. */
const DEFAULT_REVIEW_PRICE = 49_900;

/** A positive whole number of paise from the environment, or null. */
const envPrice = (raw = process.env.CUSTOM_DRAFT_REVIEW_PRICE_PAISE) => {
  const value = Number(raw);
  return Number.isInteger(value) && value > 0 ? value : null;
};

/**
 * Each setting: who may change it, and its value before anyone has. The
 * certificate is a content decision (docs/srs.md 3.5 gives Content Managers
 * the certificate templates); a price on every custom draft is system
 * configuration, Super Admin only (srs 6).
 */
export const SETTINGS: {
  [K in SettingKey]: {
    label: string;
    editRoles: readonly Role[];
    defaults: () => SettingValues[K];
  };
} = {
  certificate: {
    label: "Certificate",
    editRoles: CONTENT,
    defaults: () => ({
      title: "Certificate of Completion",
      issuerName: "Pratikar Digital Hub",
      signatoryName: "",
      signatoryTitle: "",
      footerNote: "",
    }),
  },
  pricing: {
    label: "Pricing",
    editRoles: [Role.SUPER_ADMIN],
    defaults: () => ({
      customDraftReviewPricePaise: envPrice() ?? DEFAULT_REVIEW_PRICE,
    }),
  },
};

export const SETTING_KEYS = Object.keys(SETTINGS) as SettingKey[];
