import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";

import { apiClient } from "@/shared/lib/apiClient";

import { AccountDataControls, deleteErrorMessage } from "./AccountDataControls";

jest.mock("@/shared/lib/apiClient", () => ({
  apiClient: { get: jest.fn(), del: jest.fn() },
}));
const push = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
const logout = jest.fn(() => Promise.resolve());
jest.mock("@/shared/providers/AuthProvider", () => ({
  useAuth: () => ({ logout }),
}));

const api = jest.mocked(apiClient);

describe("AccountDataControls", () => {
  afterEach(() => jest.clearAllMocks());

  it("only deletes once DELETE is typed", async () => {
    api.del.mockResolvedValue({ deleted: true });
    render(<AccountDataControls />);

    fireEvent.click(screen.getByRole("button", { name: /Delete my account/ }));
    const confirm = screen.getByRole("button", { name: "Permanently delete" });
    expect((confirm as HTMLButtonElement).disabled).toBe(true);

    fireEvent.change(screen.getByLabelText("Type DELETE to confirm"), {
      target: { value: "DELETE" },
    });
    fireEvent.click(confirm);

    await waitFor(() => expect(push).toHaveBeenCalledWith("/"));
    expect(api.del).toHaveBeenCalledWith("/users/me", { confirm: "DELETE" });
    expect(logout).toHaveBeenCalled();
  });

  it("explains a refusal and stays signed in", async () => {
    api.del.mockRejectedValue(
      new Error('API error 409: {"message":"REVIEW_IN_PROGRESS"}'),
    );
    render(<AccountDataControls />);

    fireEvent.click(screen.getByRole("button", { name: /Delete my account/ }));
    fireEvent.change(screen.getByLabelText("Type DELETE to confirm"), {
      target: { value: "DELETE" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Permanently delete" }));

    expect(await screen.findByText(/still reviewing/)).toBeTruthy();
    expect(logout).not.toHaveBeenCalled();
  });
});

describe("deleteErrorMessage", () => {
  it("names a pending payment", () => {
    expect(
      deleteErrorMessage(
        new Error('API error 409: {"message":"PAYMENT_IN_PROGRESS"}'),
      ),
    ).toMatch(/payment/i);
  });
});
