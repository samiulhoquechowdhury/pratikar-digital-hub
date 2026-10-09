import { apiClient } from "@/shared/lib/apiClient";

export type CheckStatus = "ok" | "warn" | "fail";

/** Mirrors ReadinessCheck in the API's admin/readiness/config-checks.ts. */
export interface ReadinessCheck {
  id: string;
  area: string;
  label: string;
  status: CheckStatus;
  detail: string;
  fix?: string;
}

export interface ReadinessReport {
  ready: boolean;
  summary: Record<CheckStatus, number>;
  checks: ReadinessCheck[];
}

export const readinessApi = {
  report: () => apiClient.get<ReadinessReport>("/admin/readiness"),
};
