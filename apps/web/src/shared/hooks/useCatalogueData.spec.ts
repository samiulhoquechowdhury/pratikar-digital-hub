import { renderHook, waitFor } from "@testing-library/react";

import { useCatalogueData } from "./useCatalogueData";

describe("useCatalogueData", () => {
  // The page already rendered this on the server; asking again would flash
  // a loading state over content that's already there.
  it("starts from server data and doesn't fetch", () => {
    const load = jest.fn();

    const { result } = renderHook(() =>
      useCatalogueData("k", load, "failed", ["server"]),
    );

    expect(result.current).toMatchObject({
      data: ["server"],
      isLoading: false,
    });
    expect(load).not.toHaveBeenCalled();
  });

  it("fetches in the browser when the server had nothing", async () => {
    const load = jest.fn().mockResolvedValue(["browser"]);

    const { result } = renderHook(() => useCatalogueData("k", load, "failed"));

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.data).toEqual(["browser"]));
  });

  it("reports the given message when the fetch fails", async () => {
    const load = jest.fn().mockRejectedValue(new Error("down"));

    const { result } = renderHook(() =>
      useCatalogueData("k", load, "Couldn't load courses."),
    );

    await waitFor(() =>
      expect(result.current.error).toBe("Couldn't load courses."),
    );
  });
});
