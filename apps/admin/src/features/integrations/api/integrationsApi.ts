import { apiClient } from "@/shared/lib/apiClient";

/** Mirrors IntegrationsService.list() in the API. Secrets never come back. */
export interface IntegrationField {
  key: string;
  label: string;
  secret: boolean;
  required: boolean;
  hint?: string;
  placeholder?: string;
  /** Where the value in use comes from: saved here, the server's .env, or nowhere. */
  source: "admin" | "server" | null;
  /** A secret's last four characters ("••••1234"); a plain value in full. */
  preview: string | null;
}

export interface Integration {
  id: string;
  name: string;
  purpose: string;
  console: string;
  testable: boolean;
  configured: boolean;
  fields: IntegrationField[];
}

export interface TestResult {
  ok: boolean;
  message: string;
}

export const integrationsApi = {
  list: () => apiClient.get<Integration[]>("/admin/integrations"),
  save: (key: string, value: string) =>
    apiClient.put<Integration[]>(`/admin/integrations/${key}`, { value }),
  clear: (key: string) =>
    apiClient.del<Integration[]>(`/admin/integrations/${key}`),
  test: (id: string, phone?: string) =>
    apiClient.post<TestResult>(
      `/admin/integrations/${id}/test`,
      phone ? { phone } : {},
    ),
};
