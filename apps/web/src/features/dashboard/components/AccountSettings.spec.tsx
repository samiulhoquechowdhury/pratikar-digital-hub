import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { apiClient } from "@/shared/lib/apiClient";

import { AccountSettings } from "./AccountSettings";

jest.mock("@/shared/lib/apiClient", () => ({
  apiClient: { get: jest.fn(), patch: jest.fn() },
}));
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

const updateUser = jest.fn();
jest.mock("@/shared/providers/AuthProvider", () => ({
  useAuth: () => ({ updateUser, logout: jest.fn() }),
}));

const mockedApi = jest.mocked(apiClient);

const PROFILE = {
  id: "u-1",
  name: "Asha Rao",
  email: "asha@example.com",
  phone: null,
  createdAt: "2026-09-01T00:00:00Z",
  addressLine: null,
  city: null,
  stateCode: null,
  pincode: null,
};

describe("AccountSettings", () => {
  beforeEach(() => {
    mockedApi.get.mockResolvedValue(PROFILE);
    mockedApi.patch.mockImplementation((_path, body) =>
      Promise.resolve({ ...PROFILE, ...(body as object) }),
    );
  });

  afterEach(() => jest.clearAllMocks());

  it("saves the name and billing address together", async () => {
    render(<AccountSettings />);

    fireEvent.change(await screen.findByLabelText("Address"), {
      target: { value: "12 Park Street" },
    });
    fireEvent.change(screen.getByLabelText("City"), {
      target: { value: "Kolkata" },
    });
    fireEvent.change(screen.getByLabelText("State"), {
      target: { value: "19" },
    });
    fireEvent.change(screen.getByLabelText("PIN code"), {
      target: { value: "700016" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() =>
      expect(mockedApi.patch).toHaveBeenCalledWith("/users/me", {
        name: "Asha Rao",
        addressLine: "12 Park Street",
        city: "Kolkata",
        stateCode: "19",
        pincode: "700016",
      }),
    );
    expect(await screen.findByText("Saved")).toBeTruthy();
    expect(updateUser).toHaveBeenCalledWith({ name: "Asha Rao" });
  });

  // An empty box clears the field rather than saving an empty string.
  it("sends untouched address fields as cleared", async () => {
    render(<AccountSettings />);

    fireEvent.click(
      await screen.findByRole("button", { name: /save changes/i }),
    );

    await waitFor(() =>
      expect(mockedApi.patch).toHaveBeenCalledWith("/users/me", {
        name: "Asha Rao",
        addressLine: null,
        city: null,
        stateCode: null,
        pincode: null,
      }),
    );
  });

  it("explains a bad PIN code instead of sending it", async () => {
    render(<AccountSettings />);

    fireEvent.change(await screen.findByLabelText("PIN code"), {
      target: { value: "7000" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    expect(await screen.findByText(/6-digit PIN code/)).toBeTruthy();
    expect(mockedApi.patch).not.toHaveBeenCalled();
  });
});
