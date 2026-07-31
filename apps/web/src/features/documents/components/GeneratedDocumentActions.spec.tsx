import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";

import { documentsApi } from "../api/documentsApi";

import { GeneratedDocumentActions } from "./GeneratedDocumentActions";

jest.mock("../api/documentsApi");

// Stubbed so these tests exercise the download gating rather than the whole
// checkout state machine, which useCheckout.spec.ts covers directly.
jest.mock("@/features/payments", () => ({
  BuyButton: ({ itemType }: { itemType: string }) => (
    <button type="button">buy:{itemType}</button>
  ),
}));

const mockedApi = jest.mocked(documentsApi);

/**
 * Document downloads are one-time (docs/srs.md Section 7, item 1): the request
 * that hands over the file is the same request that spends the entitlement.
 * That makes "when is this endpoint called" a correctness question, not a
 * performance one — a speculative call to decide what to render would consume
 * a download the customer never received.
 */
describe("GeneratedDocumentActions", () => {
  const template = {
    title: "Rent Agreement",
    priceInPaise: 19900,
    reviewPriceInPaise: 99900,
  };

  const renderAt = (status: "GENERATED" | "PAID" | "DOWNLOADED") =>
    render(
      <GeneratedDocumentActions
        documentId="doc-1"
        template={template}
        initialStatus={status}
      />,
    );

  beforeEach(() => {
    mockedApi.download.mockResolvedValue({ fileUrl: "https://signed/url" });
    // jsdom has no navigation; replace location so assigning href is inert.
    Object.defineProperty(window, "location", {
      writable: true,
      value: { href: "" },
    });
  });

  afterEach(() => jest.clearAllMocks());

  /** The regression that would silently burn a customer's only download. */
  it.each(["GENERATED", "PAID", "DOWNLOADED"] as const)(
    "never calls the download endpoint just to render (%s)",
    (status) => {
      renderAt(status);

      expect(mockedApi.download).not.toHaveBeenCalled();
    },
  );

  it("offers payment, not download, before the document is paid for", () => {
    renderAt("GENERATED");

    expect(screen.getByText("buy:DOCUMENT")).toBeDefined();
    expect(screen.queryByRole("button", { name: /^download$/i })).toBeNull();
  });

  it("downloads once when asked, and warns the link is single-use", async () => {
    renderAt("PAID");

    expect(screen.getByText(/works once/i)).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: /^download$/i }));

    await waitFor(() =>
      expect(mockedApi.download).toHaveBeenCalledWith("doc-1"),
    );
    expect(mockedApi.download).toHaveBeenCalledTimes(1);
    expect(window.location.href).toBe("https://signed/url");
  });

  /**
   * The server consumed the link on that first call, so leaving the button
   * live would invite a second click that can only fail.
   */
  it("withdraws the download button once the link has been spent", async () => {
    renderAt("PAID");

    fireEvent.click(screen.getByRole("button", { name: /^download$/i }));

    await waitFor(() =>
      expect(screen.queryByRole("button", { name: /^download$/i })).toBeNull(),
    );
    expect(screen.getByText(/already downloaded/i)).toBeDefined();
  });

  it("explains rather than offers a retry when already downloaded", () => {
    renderAt("DOWNLOADED");

    expect(screen.getByText(/already downloaded/i)).toBeDefined();
    expect(screen.queryByRole("button", { name: /^download$/i })).toBeNull();
  });

  it("surfaces a failed download without pretending it succeeded", async () => {
    mockedApi.download.mockRejectedValue(new Error("API error 403"));
    renderAt("PAID");

    fireEvent.click(screen.getByRole("button", { name: /^download$/i }));

    await waitFor(() => expect(screen.getByRole("alert")).toBeDefined());
    expect(window.location.href).toBe("");
  });

  // Review is a separate purchase from the document, at its own price, and is
  // offered whatever the document's own status.
  it("always offers the lawyer review as a separate purchase", () => {
    renderAt("DOWNLOADED");

    expect(screen.getByText("buy:DOCUMENT_REVIEW")).toBeDefined();
  });
});
