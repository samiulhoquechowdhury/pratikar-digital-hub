import type {
  CertificateVerification,
  Course,
  Enrollment,
} from "@pratikar/types";

import { apiClient } from "@/shared/lib/apiClient";

// Wrappers around apps/api/src/modules/lms (docs/srs.md Section 3.4).
export const lmsApi = {
  list: () => apiClient.get<Course[]>("/courses"),

  // "catalogue/" is the customer route: published courses only, and module
  // rows without the Cloudflare Stream ids that would give the videos away.
  get: (id: string) => apiClient.get<Course>(`/courses/catalogue/${id}`),

  listMyEnrollments: () => apiClient.get<Enrollment[]>("/courses/mine"),

  /** Public — no session needed, so an employer can check a candidate's claim. */
  verifyCertificate: (code: string) =>
    apiClient.get<CertificateVerification>(
      `/courses/certificates/verify/${encodeURIComponent(code)}`,
    ),
};
