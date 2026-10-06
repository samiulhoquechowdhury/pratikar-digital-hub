// Template.fieldSchema shape (docs/trd.md Section 2, docs/srs.md Section 3.2).
// Deliberately a flat array, not a nested tree — per docs/implementation-plan.md
// Milestone 4, this same schema has to drive both the manual dynamic form
// (Milestone 1) and the AI Document Generator's conversational field
// collection (Milestone 4) without a rewrite, so keep it a plain list of
// independent field definitions rather than something UI-layout-specific.

export type TemplateFieldType =
  "text" | "textarea" | "date" | "number" | "select";

export interface TemplateFieldOption {
  value: string;
  label: string;
}

/**
 * The customer's own details a template field can be filled from. Marked by
 * staff per field — "this is the customer's name" — never guessed from the
 * label: a rent agreement has two names, and only one of them is the
 * customer's.
 */
export const PROFILE_FIELDS = [
  "name",
  "email",
  "phone",
  "address",
  "city",
  "state",
  "pincode",
] as const;
export type ProfileField = (typeof PROFILE_FIELDS)[number];

export const PROFILE_FIELD_LABELS: Record<ProfileField, string> = {
  name: "Customer's full name",
  email: "Customer's email",
  phone: "Customer's phone",
  address: "Customer's street address",
  city: "Customer's city",
  state: "Customer's state",
  pincode: "Customer's PIN code",
};

export interface TemplateField {
  key: string; // maps 1:1 to the docxtemplater tag and the filledData key
  label: string;
  type: TemplateFieldType;
  required: boolean;
  placeholder?: string;
  options?: TemplateFieldOption[]; // only meaningful when type === "select"
  /** Filled in from the customer's profile when they start this template. */
  profileField?: ProfileField;
}

export type TemplateFieldSchema = TemplateField[];

export type TemplateStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface Template {
  id: string;
  title: string;
  category: string; // taxonomy still TBD — docs/srs.md Section 8, item 2
  priceInPaise: number;
  reviewPriceInPaise: number;
  fieldSchema: TemplateFieldSchema;
  status: TemplateStatus;
  createdAt: string;
}

export type GeneratedDocumentStatus = "GENERATED" | "PAID" | "DOWNLOADED";

export interface GenerateDocumentPayload {
  templateId: string;
  filledData: Record<string, string | number>;
}

export interface GeneratedDocument {
  id: string;
  userId: string;
  templateId: string;
  filledData: Record<string, unknown>;
  fileUrl: string;
  status: GeneratedDocumentStatus;
  downloadedAt: string | null;
  createdAt: string;
}
