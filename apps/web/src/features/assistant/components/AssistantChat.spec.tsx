import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";

import {
  assistantApi,
  ChatError,
  type ChatStreamEvent,
  type ChatTurn,
} from "../api/assistantApi";

import { AssistantChat, cleanAnswer } from "./AssistantChat";

// Only the network calls are mocked; ChatError and the limits stay real.
jest.mock("../api/assistantApi", () => ({
  ...jest.requireActual<typeof import("../api/assistantApi")>(
    "../api/assistantApi",
  ),
  assistantApi: { status: jest.fn(), stream: jest.fn() },
}));

const status = jest.mocked(assistantApi.status);
const stream = jest.mocked(assistantApi.stream);

/** Makes the next question stream these events, then finish. */
const streams = (...events: ChatStreamEvent[]) =>
  stream.mockImplementationOnce((_turns, onEvent) => {
    events.forEach(onEvent);
    return Promise.resolve();
  });

const typeAndSend = (text: string) => {
  const box = screen.getByLabelText("Ask a question");
  fireEvent.change(box, { target: { value: text } });
  fireEvent.keyDown(box, { key: "Enter" });
};

const RENT = {
  sourceType: "template" as const,
  sourceId: "t1",
  title: "Rent Agreement",
  href: "/documents/t1",
  priceInPaise: 19900,
  kind: "Document template",
};

describe("AssistantChat", () => {
  beforeAll(() => {
    // jsdom has no layout, so the log's auto-scroll has nothing to call.
    Element.prototype.scrollTo = jest.fn();
  });

  beforeEach(() => status.mockResolvedValue({ assistant: true }));
  afterEach(() => jest.clearAllMocks());

  // The point of the rewrite: people ask their own question.
  it("offers no canned questions", () => {
    render(<AssistantChat />);
    expect(screen.queryAllByRole("button", { name: /\?$/ })).toHaveLength(0);
    expect(screen.getByText("What do you need help with?")).toBeTruthy();
  });

  it("streams the answer, then shows the cited items as cards", async () => {
    streams(
      { type: "delta", text: "The Rent Agreement " },
      { type: "delta", text: "[1] fits." },
      {
        type: "done",
        answer: "The Rent Agreement [1] fits.",
        sources: [RENT],
        suggestDraft: false,
      },
    );
    render(<AssistantChat />);

    typeAndSend("I need a rent agreement");

    expect(await screen.findByText("The Rent Agreement fits.")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Rent Agreement" }).getAttribute("href"),
    ).toBe("/documents/t1");
    expect(screen.getByText("Document template")).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Fill in by chat" })
        .getAttribute("href"),
    ).toBe("/documents/t1?fill=chat");
  });

  it("offers a custom draft when the assistant suggests one", async () => {
    streams({
      type: "done",
      answer: "We can draft a partnership deed for you. [draft]",
      sources: [],
      suggestDraft: true,
    });
    render(<AssistantChat />);

    typeAndSend("partnership deed for two partners");

    const offer = await screen.findByRole("link", { name: /Draft it with AI/ });
    expect(offer.getAttribute("href")).toBe(
      "/documents/custom?type=partnership%20deed%20for%20two%20partners",
    );
    expect(
      screen.getByText("We can draft a partnership deed for you."),
    ).toBeTruthy();
  });

  it("sends the earlier turns with the next question", async () => {
    streams({
      type: "done",
      answer: "First.",
      sources: [],
      suggestDraft: false,
    });
    render(<AssistantChat />);
    typeAndSend("first question");
    await screen.findByText("First.");

    streams({
      type: "done",
      answer: "Second.",
      sources: [],
      suggestDraft: false,
    });
    typeAndSend("second question");
    await screen.findByText("Second.");

    const turns: ChatTurn[] = stream.mock.calls[1]![0];
    expect(turns).toEqual([
      { role: "user", content: "first question" },
      { role: "assistant", content: "First." },
      { role: "user", content: "second question" },
    ]);
  });

  it("clears text a fallback replaced", async () => {
    streams(
      { type: "delta", text: "Half an ans" },
      { type: "reset" },
      { type: "done", answer: "Fresh.", sources: [], suggestDraft: false },
    );
    render(<AssistantChat />);
    typeAndSend("q");

    expect(await screen.findByText("Fresh.")).toBeTruthy();
    expect(screen.queryByText(/Half an ans/)).toBeNull();
  });

  it("says it's offline, instead of answering, when the server has no model", async () => {
    status.mockResolvedValue({ assistant: false });
    render(<AssistantChat />);

    expect(
      await screen.findByText("The assistant is offline right now"),
    ).toBeTruthy();
    expect(
      screen.getByLabelText<HTMLTextAreaElement>("Ask a question").disabled,
    ).toBe(true);
  });

  it("explains a busy service without pretending to answer", async () => {
    stream.mockRejectedValueOnce(new ChatError("busy"));
    render(<AssistantChat />);
    typeAndSend("q");

    expect(await screen.findByText(/getting a lot of questions/)).toBeTruthy();
  });

  it("reports a failure mid-answer", async () => {
    streams({ type: "error", reason: "AI_ERROR" });
    render(<AssistantChat />);
    typeAndSend("q");

    await waitFor(() =>
      expect(screen.getByText(/Something went wrong/)).toBeTruthy(),
    );
  });
});

describe("cleanAnswer", () => {
  it("drops citation and draft markers", () => {
    expect(cleanAnswer("Try [1] and [12]. [draft]")).toBe("Try and.");
  });
});
