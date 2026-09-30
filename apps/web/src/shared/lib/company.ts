/**
 * The business's own details, as the legal and contact pages print them.
 *
 * Read from NEXT_PUBLIC_* settings rather than written into the pages: they
 * are the client's facts, they differ between staging and production, and
 * whoever fills them in should not have to edit a legal document to do it.
 * None of them is secret — every one is printed on the public site.
 *
 * Anything left blank renders as a highlighted placeholder, and while any
 * are blank every legal page carries a "draft" banner. An unfinished policy
 * that looks finished is the one outcome worth designing against here.
 */
export interface CompanyDetails {
  /** As registered — the name on invoices and in the Terms. */
  legalName: string;
  /** Registered office, in one line. */
  address: string;
  supportEmail: string;
  supportPhone: string;
  /** Printed on the Contact page; GST invoices carry it separately. */
  gstin: string;
  /** Required under the IT Rules, 2021 and the DPDP Act. */
  grievanceOfficerName: string;
  grievanceOfficerEmail: string;
  /** City whose courts the Terms name. */
  jurisdictionCity: string;
  /** "Last updated" on every legal page, as the lawyer signs it off. */
  policiesUpdatedOn: string;
}

type Field = keyof CompanyDetails;

/** How a blank field reads on the page, so it's obvious what goes there. */
export const PLACEHOLDERS: Record<Field, string> = {
  legalName: "registered company name",
  address: "registered office address",
  supportEmail: "support email address",
  supportPhone: "support phone number",
  gstin: "GSTIN",
  grievanceOfficerName: "grievance officer's name",
  grievanceOfficerEmail: "grievance officer's email",
  jurisdictionCity: "city of jurisdiction",
  policiesUpdatedOn: "date these policies take effect",
};

/**
 * The details as currently configured. A function rather than a constant so
 * each render reads them — Next still inlines the values at build time, and
 * a test can set them without re-importing the module.
 *
 * Spelled out in full: Next inlines NEXT_PUBLIC_* only where the whole name
 * appears literally, so a lookup built from a variable would read undefined.
 */
export const companyDetails = (): CompanyDetails => ({
  legalName: process.env.NEXT_PUBLIC_COMPANY_LEGAL_NAME ?? "",
  address: process.env.NEXT_PUBLIC_COMPANY_ADDRESS ?? "",
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "",
  supportPhone: process.env.NEXT_PUBLIC_SUPPORT_PHONE ?? "",
  gstin: process.env.NEXT_PUBLIC_COMPANY_GSTIN ?? "",
  grievanceOfficerName: process.env.NEXT_PUBLIC_GRIEVANCE_OFFICER_NAME ?? "",
  grievanceOfficerEmail: process.env.NEXT_PUBLIC_GRIEVANCE_OFFICER_EMAIL ?? "",
  jurisdictionCity: process.env.NEXT_PUBLIC_JURISDICTION_CITY ?? "",
  policiesUpdatedOn: process.env.NEXT_PUBLIC_POLICIES_UPDATED_ON ?? "",
});

/** The fields still to be filled in, in the order the pages use them. */
export const missingCompanyDetails = (
  details: CompanyDetails = companyDetails(),
): Field[] =>
  (Object.keys(PLACEHOLDERS) as Field[]).filter(
    (field) => !details[field].trim(),
  );
