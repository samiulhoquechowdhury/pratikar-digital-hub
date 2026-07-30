// Customer-facing catalogue shapes: content library, courses, and orders.
// Mirrors the Prisma models in apps/api/prisma/schema.prisma — keep in sync.

import type { TemplateStatus } from "./documents";

export const CONTENT_CATEGORIES = [
  "LEGAL_PRACTICE",
  "BUSINESS_COMPLIANCE",
  "PROPERTY_DOCUMENTATION",
  "DIGITAL_CAREER",
  "CHECKLISTS_REFERENCE",
] as const;
export type ContentCategory = (typeof CONTENT_CATEGORIES)[number];

export type ContentType = "EBOOK" | "CHECKLIST";

/**
 * An item as the catalogue exposes it. No fileUrl: that's the storage key the
 * purchase entitles you to, and the API deliberately withholds it until a PAID
 * order exists. Downloads come from POST /content-library/:id/download, which
 * returns a signed URL that expires.
 */
export interface ContentLibraryItem {
  id: string;
  title: string;
  category: ContentCategory;
  type: ContentType;
  priceInPaise: number;
  status: TemplateStatus;
  createdAt: string;
}

export interface CourseModule {
  id: string;
  title: string;
  order: number;
  /**
   * Cloudflare Stream UID. Absent on the public catalogue endpoint — the UID
   * alone is enough to play the video, so it's only returned to a caller with
   * an unexpired enrolment.
   */
  videoAssetId?: string;
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
}

export type OrderItemType =
  "DOCUMENT" | "DOCUMENT_REVIEW" | "CONTENT_ITEM" | "COURSE";

export type OrderStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export interface CustomerOrder {
  id: string;
  itemType: OrderItemType;
  amount: number; // paise, excluding GST
  gstAmount: number; // paise
  status: OrderStatus;
  createdAt: string;
  contentLibraryItem: { id: string; title: string } | null;
  course: { id: string; title: string } | null;
  generatedDocument: { id: string; template: { title: string } } | null;
}

export interface Enrollment {
  id: string;
  courseId: string;
  enrolledAt: string;
  /** Access to video ends here; the certificate is kept (docs/srs.md 7.2). */
  expiresAt: string;
  /**
   * Set by the server once every module has been completed — never by the
   * client. The certificate is issued at the same moment.
   */
  completedAt: string | null;
  course: Course & { _count?: { modules: number } };
  certificate: {
    id: string;
    verificationCode: string;
    issuedAt: string;
  } | null;
  /** Which modules are done. Ids only; the count is what the UI shows. */
  progress?: { moduleId: string }[];
}

export interface CertificateVerification {
  valid: boolean;
  courseTitle?: string;
  holderName?: string | null;
  issuedAt?: string;
}
