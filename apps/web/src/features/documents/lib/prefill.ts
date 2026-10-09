import {
  GST_STATE_NAMES,
  type ProfileField,
  type TemplateField,
} from "@pratikar/types";

import type { FilledData } from "../components/DynamicTemplateForm";

/** The customer's own details, as GET /users/me returns them. */
export interface CustomerProfile {
  name: string | null;
  email: string | null;
  phone: string | null;
  addressLine: string | null;
  city: string | null;
  stateCode: string | null;
  pincode: string | null;
}

const fromProfile = (
  profile: CustomerProfile,
  field: ProfileField,
): string | null => {
  switch (field) {
    case "name":
      return profile.name;
    case "email":
      return profile.email;
    case "phone":
      return profile.phone;
    case "address":
      return profile.addressLine;
    case "city":
      return profile.city;
    case "state":
      return profile.stateCode
        ? (GST_STATE_NAMES[profile.stateCode] ?? null)
        : null;
    case "pincode":
      return profile.pincode;
  }
};

/**
 * A value as this field can hold it, or undefined when it can't: a number
 * field gets a number, a select only one of its own options (matched by
 * value or label), a date only a real YYYY-MM-DD. Pre-filling something the
 * field would reject is worse than leaving it blank.
 */
export function fitToField(
  field: TemplateField,
  raw: unknown,
): string | number | undefined {
  // Only plain values: an object or array from an old answer can't be one.
  if (typeof raw !== "string" && typeof raw !== "number") return undefined;
  const text = String(raw).trim();
  if (text === "") return undefined;

  switch (field.type) {
    case "number": {
      const value = Number(text.replace(/,/g, ""));
      return Number.isFinite(value) ? value : undefined;
    }
    case "select": {
      const option = field.options?.find(
        (o) => o.value === text || o.label.toLowerCase() === text.toLowerCase(),
      );
      return option?.value;
    }
    case "date":
      return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : undefined;
    default:
      return text;
  }
}

/**
 * The fields staff marked as the customer's own details, filled from their
 * profile. Only marked fields: a template with a landlord and a tenant has
 * two names, and guessing which is the customer's would put one in the
 * wrong place.
 */
export function prefillFromProfile(
  fields: TemplateField[],
  profile: CustomerProfile,
): FilledData {
  const filled: FilledData = {};
  for (const field of fields) {
    if (!field.profileField) continue;
    const value = fitToField(field, fromProfile(profile, field.profileField));
    if (value !== undefined) filled[field.key] = value;
  }
  return filled;
}

/**
 * A previous document's answers, carried into this template as it is now.
 * Fields since removed are dropped, and answers that no longer fit their
 * field — an option taken out of a list — are left blank.
 */
export function answersFromPrevious(
  fields: TemplateField[],
  previous: Record<string, unknown>,
): FilledData {
  const filled: FilledData = {};
  for (const field of fields) {
    const value = fitToField(field, previous[field.key]);
    if (value !== undefined) filled[field.key] = value;
  }
  return filled;
}
