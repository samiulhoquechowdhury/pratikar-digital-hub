import type { TemplateStatus } from "@pratikar/types";

import { apiClient } from "@/shared/lib/apiClient";

export interface CourseModule {
  id?: string;
  title: string;
  order: number;
  videoAssetId: string; // Cloudflare Stream UID
}

export interface Course {
  id: string;
  title: string;
  description: string | null;
  priceInPaise: number;
  accessDurationDays: number;
  status: TemplateStatus;
  createdAt: string;
  modules?: CourseModule[];
  _count?: { modules: number; enrollments: number };
}

export interface UpsertCoursePayload {
  title: string;
  description?: string;
  priceInPaise: number;
  accessDurationDays: number;
  status: TemplateStatus;
}

export const coursesApi = {
  listAll: () => apiClient.get<Course[]>("/courses/all"),

  get: (id: string) => apiClient.get<Course>(`/courses/${id}`),

  create: (payload: UpsertCoursePayload) =>
    apiClient.post<Course>("/courses", payload),

  update: (id: string, payload: UpsertCoursePayload) =>
    apiClient.put<Course>(`/courses/${id}`, payload),

  /** Wholesale replacement — see ReplaceModulesDto on the API for why. */
  replaceModules: (id: string, modules: CourseModule[]) =>
    apiClient.put<CourseModule[]>(`/courses/${id}/modules`, {
      modules: modules.map(({ title, order, videoAssetId }) => ({
        title,
        order,
        videoAssetId,
      })),
    }),
};
