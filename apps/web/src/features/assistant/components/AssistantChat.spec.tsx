import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";

import { assistantApi, ChatError } from "../api/assistantApi";

import { AssistantChat } from "./AssistantChat";

// Only the network call is mocked; ChatError and the limits stay real.
jest.mock("../api/assistantApi", () => ({
  ...jest.requireActual<typeof import("../api/assistantApi")>(
    "../api/assistantApi",
  ),
  assistantApi: { ask: jest.fn() },
}));

const ask = jest.mocked(assistantApi.ask);

const typeAndSend = (text: string) => {
  const box = screen.getByLabelText("Ask a question");
  fireEvent.change(box, { target: { value: text } });
  fireEvent.keyDown(box, { key: "Enter" });
};

/**
 * The chat starts live and falls back to the scripted preview when the server
 * has no model key — the site has to keep working the day before the key is
 * set, and upgrade itself the day after.
 */
describe("AssistantChat", () => {
  beforeAll(() => {
    // jsdom has no layout, so the log's auto-scroll has nothing to call.
    Element.prototype.scrollTo = jest.fn();
  });

  afterEach(() => jest.clearAllMocks());

  it("shows a live answer without its citation markers, and links the cited items", async () => {
    ask.mockResolvedValue({
      answer: "For a flat, the Rent Agreement [1] is what you need.",
      sources: [
        {
          sourceType: "template",
          sourceId: "t1",
          title: "Rent Agreement",
          href: "/documents/t1",
          priceInPaise: 19900,
        },
      ],
    });
    render(<AssistantChat />);

    typeAndSend("I need a rent agreement");

    expect(
      await screen.findByText(
        "For a flat, the Rent Agreement is what you need.",
      ),
    ).toBeTruthy();
    const link = screen.getByRole("link", { name: /Rent Agreement ·/ });
    expect(link.getAttribute("href")).toBe("/documents/t1");
    expect(ask).toHaveBeenCalledWith([
      { role: "user", content: "I need a rent agreement" },
    ]);
  });

  it("sends the earlier turns with the next question", async () => {
    ask.mockResolvedValue({ answer: "The first answer.", sources: [] });
    render(<AssistantChat />);
    typeAndSend("first question");
    await screen.findByText("The first answer.");

    ask.mockResolvedValue({ answer: "The second answer.", sources: [] });
    typeAndSend("second question");
    await screen.findByText("The second answer.");

    expect(ask).toHaveBeenLastCalledWith([
      { role: "user", content: "first question" },
      { role: "assistant", content: "The first answer." },
      { role: "user", content: "second question" },
    ]);
  });

  it("falls back to the scripted preview when the server has no model, and stays there", async () => {
    ask.mockRejectedValue(new ChatError("not-configured"));
    render(<AssistantChat />);

    typeAndSend("zqxv plomb");

    // The banner says what the visitor is now looking at.
    expect(await screen.findByText(/Scripted answers/)).toBeTruthy();

    // The scripted reply lands after its short pause; only then is the box
    // free for the next question.
    expect(
      await screen.findAllByText(/can't answer that one yet/),
    ).toHaveLength(1);

    typeAndSend("vorpal snark");
    await waitFor(() =>
      expect(screen.getAllByText(/can't answer that one yet/)).toHaveLength(2),
    );
    expect(ask).toHaveBeenCalledTimes(1);
  });

  it("says so plainly when the assistant is busy", async () => {
    ask.mockRejectedValue(new ChatError("busy"));
    render(<AssistantChat />);

    typeAndSend("rent agreement");

    expect(
      await screen.findByText(/getting a lot of questions right now/),
    ).toBeTruthy();
  });
});
