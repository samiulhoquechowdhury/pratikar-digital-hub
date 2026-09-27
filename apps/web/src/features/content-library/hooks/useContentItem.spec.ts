import { renderHook, waitFor } from "@testing-library/react";

import { apiClient } from "@/shared/lib/apiClient";

import { contentLibraryApi } from "../api/contentLibraryApi";

import { useContentItem } from "./useContentItem";

jest.mock("../api/contentLibraryApi");
jest.mock("@/shared/lib/apiClient");

const mockedApi = jest.mocked(contentLibraryApi);
const mockedClient = jest.mocked(apiClient);

/**
 * Decides whether a customer is shown "buy" or "download". Getting it wrong
 * one way offers a download that will 403; the other way asks someone to pay
 * twice for the same item.
 *
 * Ownership is read from the caller's own orders rather than by probing the
 * download endpoint — probing is what the documents feature must never do,
 * and the same habit here would be wrong for the same reason.
 */
describe("useContentItem", () => {
  const ITEM = {
    id: "item-1",
    title: "GST Filing Checklist",
    category: "BUSINESS_COMPLIANCE",
    type: "CHECKLIST",
    priceInPaise: 14900,
    status: "PUBLISHED",
    createdAt: "2026-07-01T00:00:00.000Z",
  } as Awaited<ReturnType<typeof contentLibraryApi.get>>;

  const order = (status: string, itemId: string | null) => ({
    status,
    contentLibraryItem: itemId ? { id: itemId } : null,
  });

  const withOrders = (orders: unknown[]) => {
    mockedClient.get.mockResolvedValue(orders);
  };

  beforeEach(() => {
    mockedApi.get.mockResolvedValue(ITEM);
    withOrders([]);
  });

  afterEach(() => jest.clearAllMocks());

  it("treats a PAID order for this item as ownership", async () => {
    withOrders([order("PAID", "item-1")]);

    const { result } = renderHook(() => useContentItem("item-1", true));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isOwned).toBe(true);
    expect(result.current.item).toEqual(ITEM);
  });

  it("does not treat an unpaid order as ownership", async () => {
    withOrders([order("PENDING", "item-1")]);

    const { result } = renderHook(() => useContentItem("item-1", true));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isOwned).toBe(false);
  });

  /**
   * Refunding moves the order to REFUNDED, which is what revokes access —
   * the server stops matching it, and so must the UI, or it offers a download
   * that can only fail.
   */
  it("treats a refunded purchase as no longer owned", async () => {
    withOrders([order("REFUNDED", "item-1")]);

    const { result } = renderHook(() => useContentItem("item-1", true));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isOwned).toBe(false);
  });

  // Buying one checklist must not unlock the rest of the library.
  it("does not treat a purchase of a different item as ownership", async () => {
    withOrders([order("PAID", "some-other-item")]);

    const { result } = renderHook(() => useContentItem("item-1", true));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isOwned).toBe(false);
  });

  // Course and document orders carry a null contentLibraryItem.
  it("ignores orders that aren't for content items at all", async () => {
    withOrders([order("PAID", null)]);

    const { result } = renderHook(() => useContentItem("item-1", true));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isOwned).toBe(false);
  });

  it("never calls the download endpoint to work out ownership", async () => {
    withOrders([order("PAID", "item-1")]);

    const { result } = renderHook(() => useContentItem("item-1", true));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mockedApi.download).not.toHaveBeenCalled();
  });

  // The item is public now; only the ownership check needs an account.
  it("loads the item for a visitor but never asks for their orders", async () => {
    const { result } = renderHook(() => useContentItem("item-1", false));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.item).toEqual(ITEM);
    expect(result.current.isOwned).toBe(false);
    expect(mockedClient.get).not.toHaveBeenCalled();
  });

  // Otherwise an owner sees "Buy" flash up before "Download".
  it("stays loading until ownership is known, not just the item", async () => {
    let resolveOrders: (orders: unknown[]) => void = () => undefined;
    mockedClient.get.mockReturnValue(
      new Promise((resolve) => {
        resolveOrders = resolve;
      }),
    );

    const { result } = renderHook(() => useContentItem("item-1", true));

    await waitFor(() => expect(mockedApi.get).toHaveBeenCalled());
    expect(result.current.isLoading).toBe(true);

    resolveOrders([order("PAID", "item-1")]);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isOwned).toBe(true);
  });

  it("reports an error rather than rendering a half-loaded item", async () => {
    mockedApi.get.mockRejectedValue(new Error("API error 404"));

    const { result } = renderHook(() => useContentItem("item-1", true));

    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(result.current.item).toBeNull();
  });

  /** Called after a purchase confirms, to swap Buy for Download in place. */
  it("re-reads ownership on demand once a purchase lands", async () => {
    const { result } = renderHook(() => useContentItem("item-1", true));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isOwned).toBe(false);

    withOrders([order("PAID", "item-1")]);
    result.current.refreshOwnership();

    await waitFor(() => expect(result.current.isOwned).toBe(true));
  });
});
