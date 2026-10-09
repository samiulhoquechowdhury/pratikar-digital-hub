import { apiClient } from "@/shared/lib/apiClient";

export interface CertificateSettings {
  title: string;
  issuerName: string;
  signatoryName: string;
  signatoryTitle: string;
  footerNote: string;
}

export interface PricingSettings {
  customDraftReviewPricePaise: number;
}

export type SettingRow =
  | {
      key: "certificate";
      label: string;
      canEdit: boolean;
      value: CertificateSettings;
    }
  | { key: "pricing"; label: string; canEdit: boolean; value: PricingSettings };

export const settingsApi = {
  list: () => apiClient.get<SettingRow[]>("/settings"),
  save: (key: SettingRow["key"], value: object) =>
    apiClient.put<object>(`/settings/${key}`, value),
};
