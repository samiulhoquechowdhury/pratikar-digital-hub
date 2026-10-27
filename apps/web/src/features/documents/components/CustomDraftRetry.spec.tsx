import { render, screen, waitFor } from "@testing-library/react";
import React from "react";

import { documentsApi, type MyDocument } from "../api/documentsApi";

import { CustomDraftForm } from "./CustomDraftForm";
import { DocumentDetail } from "./DocumentDetail";

jest.mock("../api/documentsApi");
jest.mock("@/features/payments", () => ({ BuyButton: () => null }));
jest.mock("@/features/notifications", () => ({ PushOptIn: () => null }));
jest.mock("@/shared/providers/AuthProvider", () => ({
  useAuth: () => ({ user: { id: "user-1" }, isRestoring: false }),
}));

let searchParams = new URLSearchParams();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => "/documents/custom",
  useSearchParams: () => searchParams,
}));

const mockedApi = jest.mocked(documentsApi);

const BRIEF = {
  documentType: "Partnership deed",
  details: "Two partners, Asha and Vikram, sharing profits equally in Pune.",
  stateCode: "27",
};

const failedDraft: MyDocument = {
  id: "doc-1",
  kind: "CUSTOM",
  templateId: null,
  title: "Partnership deed",
  status: "GENERATED",
  createdAt: "2026-10-27T10:00:00Z",
  downloadedAt: null,
  filledData: {},
  ready: false,
  priceInPaise: null,
  reviewPriceInPaise: 99_900,
  template: null,
  brief: BRIEF,
  summary: null,
  missingDetails: [],
  basedOn: [],
  revisionCount: 0,
  draftError:
    "We couldn't draft this right now. Please try again in a few minutes.",
  review: null,
};

/**
 * A draft that fails mustn't cost the customer what they wrote: the failed
 * page shows their request, and "Edit and try again" reopens the form with
 * it filled in.
 */
describe("retrying a failed custom draft", () => {
  beforeEach(() => {
    mockedApi.getMine.mockResolvedValue(failedDraft);
    mockedApi.draftPricing.mockResolvedValue({
      available: true,
      reviewPriceInPaise: 99_900,
      maxRevisions: 5,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    searchParams = new URLSearchParams();
  });

  it("shows the request and links back to the form with it", async () => {
    render(<DocumentDetail documentId="doc-1" />);

    expect(await screen.findByText(failedDraft.draftError!)).toBeTruthy();
    expect(screen.getByText(BRIEF.details)).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: /edit and try again/i })
        .getAttribute("href"),
    ).toBe("/documents/custom?from=doc-1");
  });

  it("fills the form from ?from=", async () => {
    searchParams = new URLSearchParams("from=doc-1");
    render(<CustomDraftForm />);

    await waitFor(() =>
      expect(
        screen.getByLabelText<HTMLTextAreaElement>(/describe the details/i)
          .value,
      ).toBe(BRIEF.details),
    );
    expect(mockedApi.getMine).toHaveBeenCalledWith("doc-1");
    expect(
      screen.getByLabelText<HTMLInputElement>(/what document do you need/i)
        .value,
    ).toBe(BRIEF.documentType);
    expect(screen.getByLabelText<HTMLSelectElement>(/state/i).value).toBe("27");
  });

  it("leaves the form empty without ?from=", async () => {
    render(<CustomDraftForm />);
    await waitFor(() => expect(mockedApi.draftPricing).toHaveBeenCalled());
    expect(mockedApi.getMine).not.toHaveBeenCalled();
  });
});
