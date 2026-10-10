import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";

import { IntentSearch } from "./IntentSearch";

const push = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const submit = (text: string) => {
  const box = screen.getByRole("searchbox");
  fireEvent.change(box, { target: { value: text } });
  fireEvent.submit(box.closest("form")!);
};

describe("IntentSearch", () => {
  afterEach(() => push.mockClear());

  it("searches the catalogue by default", () => {
    render(<IntentSearch />);
    submit("rent agreement");
    expect(push).toHaveBeenCalledWith("/search?q=rent%20agreement");
  });

  it("starts an AI draft with the words as the document type", () => {
    render(<IntentSearch />);
    fireEvent.click(screen.getByRole("radio", { name: /Draft with AI/ }));
    submit("Partnership deed");
    expect(push).toHaveBeenCalledWith(
      "/documents/custom?type=Partnership%20deed",
    );
  });

  it("asks the assistant", () => {
    render(<IntentSearch />);
    fireEvent.click(screen.getByRole("radio", { name: /Ask a question/ }));
    submit("My tenant hasn't paid");
    expect(push).toHaveBeenCalledWith(
      "/assistant?q=My%20tenant%20hasn't%20paid",
    );
  });

  it("marks the chosen mode, and ignores an empty search", () => {
    render(<IntentSearch />);
    expect(
      screen
        .getByRole("radio", { name: /Find a document/ })
        .getAttribute("aria-checked"),
    ).toBe("true");
    submit("   ");
    expect(push).not.toHaveBeenCalled();
  });
});
