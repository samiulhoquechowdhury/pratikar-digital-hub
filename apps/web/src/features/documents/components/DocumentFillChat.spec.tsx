import type { Template } from "@pratikar/types";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";

import { documentFillApi } from "../api/documentFillApi";

import { DocumentFillChat } from "./DocumentFillChat";

jest.mock("../api/documentFillApi", () => ({
  ...jest.requireActual<typeof import("../api/documentFillApi")>(
    "../api/documentFillApi",
  ),
  documentFillApi: { turn: jest.fn() },
}));

const turn = jest.mocked(documentFillApi.turn);

const TEMPLATE: Template = {
  id: "t1",
  title: "Rent Agreement",
  category: "agreement",
  priceInPaise: 100,
  reviewPriceInPaise: 100,
  status: "PUBLISHED",
  createdAt: "2026-09-01T00:00:00.000Z",
  fieldSchema: [
    { key: "tenant", label: "Tenant's name", type: "text", required: true },
    { key: "rent", label: "Monthly rent", type: "number", required: true },
    { key: "start", label: "Start date", type: "date", required: true },
  ],
};

const send = (text: string) => {
  const box = screen.getByLabelText("Your answer");
  fireEvent.change(box, { target: { value: text } });
  fireEvent.keyDown(box, { key: "Enter" });
};

describe("DocumentFillChat", () => {
  beforeAll(() => {
    Element.prototype.scrollTo = jest.fn();
  });
  afterEach(() => jest.clearAllMocks());

  const renderChat = () => {
    const onReview = jest.fn();
    const onUnavailable = jest.fn();
    render(
      <DocumentFillChat
        template={TEMPLATE}
        onReview={onReview}
        onUnavailable={onUnavailable}
      />,
    );
    return { onReview, onUnavailable };
  };

  // Every recorded answer is visible beside the conversation — that's where
  // a misheard name gets caught.
  it("shows each answer as it's recorded, and flags an unclear one", async () => {
    turn.mockResolvedValue({
      reply: "Thanks — when does it start?",
      answers: { tenant: "A. Banerjee", rent: 18000 },
      missing: [{ key: "start", label: "Start date" }],
      unclear: [{ key: "start", label: "Start date" }],
      complete: false,
    });
    renderChat();

    send("Tenant A. Banerjee, 18k a month, from 30 Feb");

    expect(
      await screen.findByText("Thanks — when does it start?"),
    ).toBeTruthy();
    expect(screen.getByText("A. Banerjee")).toBeTruthy();
    expect(screen.getByText("18,000")).toBeTruthy();
    expect(screen.getByText("Unclear — please restate")).toBeTruthy();
    expect(screen.getByText("2 of 3 recorded")).toBeTruthy();
  });

  it("sends the answers so far with each turn", async () => {
    turn.mockResolvedValueOnce({
      reply: "Rent?",
      answers: { tenant: "A" },
      missing: [],
      unclear: [],
      complete: false,
    });
    renderChat();
    send("tenant A");
    await screen.findByText("Rent?");

    turn.mockResolvedValueOnce({
      reply: "Start date?",
      answers: { tenant: "A", rent: 5 },
      missing: [],
      unclear: [],
      complete: false,
    });
    send("5");
    await screen.findByText("Start date?");

    expect(turn).toHaveBeenLastCalledWith(
      "t1",
      [
        { role: "user", content: "tenant A" },
        { role: "assistant", content: "Rent?" },
        { role: "user", content: "5" },
      ],
      { tenant: "A" },
    );
  });

  // It never generates: the answers go to the form to be checked.
  it("hands the answers to the form on review", async () => {
    turn.mockResolvedValue({
      reply: "All done.",
      answers: { tenant: "A", rent: 5, start: "2026-11-01" },
      missing: [],
      unclear: [],
      complete: true,
    });
    const { onReview } = renderChat();
    send("everything");
    await screen.findByText("All done.");

    fireEvent.click(screen.getByRole("button", { name: "Review in the form" }));

    expect(onReview).toHaveBeenCalledWith({
      tenant: "A",
      rent: 5,
      start: "2026-11-01",
    });
  });

  it("gives way to the form when the AI isn't configured", async () => {
    turn.mockRejectedValue(
      new Error('API error 503: {"message":"AI_NOT_CONFIGURED"}'),
    );
    const { onUnavailable } = renderChat();

    send("hello");

    await waitFor(() => expect(onUnavailable).toHaveBeenCalled());
  });
});
