import { render, screen } from "@testing-library/react";
import React from "react";

import {
  missingCompanyDetails,
  type CompanyDetails,
} from "@/shared/lib/company";

import { TERMS_INTRO, TERMS_SECTIONS } from "../content/terms";

import { LegalPage } from "./LegalPage";

const COMPLETE: CompanyDetails = {
  legalName: "Pratikar Legal Services Pvt Ltd",
  address: "12 Park Street, Kolkata 700016",
  supportEmail: "help@example.in",
  supportPhone: "+91 33 0000 0000",
  gstin: "19AAAAA0000A1Z5",
  grievanceOfficerName: "A. Sen",
  grievanceOfficerEmail: "grievance@example.in",
  jurisdictionCity: "Kolkata",
  policiesUpdatedOn: "1 November 2026",
};

const COMPANY_ENV = {
  NEXT_PUBLIC_COMPANY_LEGAL_NAME: COMPLETE.legalName,
  NEXT_PUBLIC_COMPANY_ADDRESS: COMPLETE.address,
  NEXT_PUBLIC_SUPPORT_EMAIL: COMPLETE.supportEmail,
  NEXT_PUBLIC_SUPPORT_PHONE: COMPLETE.supportPhone,
  NEXT_PUBLIC_COMPANY_GSTIN: COMPLETE.gstin,
  NEXT_PUBLIC_GRIEVANCE_OFFICER_NAME: COMPLETE.grievanceOfficerName,
  NEXT_PUBLIC_GRIEVANCE_OFFICER_EMAIL: COMPLETE.grievanceOfficerEmail,
  NEXT_PUBLIC_JURISDICTION_CITY: COMPLETE.jurisdictionCity,
  NEXT_PUBLIC_POLICIES_UPDATED_ON: COMPLETE.policiesUpdatedOn,
};

describe("missingCompanyDetails", () => {
  it("is empty when every detail is filled in", () => {
    expect(missingCompanyDetails(COMPLETE)).toEqual([]);
  });

  it("names each blank, and treats whitespace as blank", () => {
    expect(
      missingCompanyDetails({ ...COMPLETE, gstin: "", address: "   " }),
    ).toEqual(["address", "gstin"]);
  });
});

/**
 * A policy that looks finished while it has gaps is the failure to avoid:
 * the banner and the highlighted placeholders are what stop it.
 */
describe("LegalPage", () => {
  const original = process.env;
  afterEach(() => {
    process.env = original;
  });

  it("marks itself a draft, and shows what's missing, while details are blank", () => {
    render(
      <LegalPage
        title="Terms of Use"
        intro={TERMS_INTRO}
        sections={TERMS_SECTIONS}
      />,
    );

    expect(screen.getByText(/Draft — pending legal review/)).toBeTruthy();
    expect(
      screen.getAllByText("[registered company name]").length,
    ).toBeGreaterThan(0);
  });

  it("drops the draft banner once every detail is in", () => {
    process.env = { ...original, ...COMPANY_ENV };

    render(
      <LegalPage
        title="Terms of Use"
        intro={TERMS_INTRO}
        sections={TERMS_SECTIONS}
      />,
    );

    expect(screen.queryByText(/Draft — pending legal review/)).toBeNull();
    expect(screen.queryByText(/^\[.*\]$/)).toBeNull();
    expect(
      screen.getAllByText(new RegExp(COMPLETE.legalName)).length,
    ).toBeGreaterThan(0);
  });

  it("links every section from the contents, by its anchor", () => {
    const { container } = render(
      <LegalPage
        title="Terms of Use"
        intro={TERMS_INTRO}
        sections={TERMS_SECTIONS}
      />,
    );

    for (const section of TERMS_SECTIONS) {
      expect(
        container.querySelector(`a[href="#${section.id}"]`),
      ).not.toBeNull();
      expect(container.querySelector(`section#${section.id}`)).not.toBeNull();
    }
  });
});
