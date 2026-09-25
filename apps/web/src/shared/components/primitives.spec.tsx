import { Button, IconButton, SkeletonTable } from "@pratikar/ui";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";

/**
 * These primitives live in packages/ui, which has no test runner of its own —
 * so they are exercised from here, the app that consumes them most.
 *
 * They are worth pinning because they are now load-bearing: `loading` replaced
 * eleven hand-written `{busy ? "Saving…" : …}` labels across both apps, and a
 * regression here is a regression everywhere at once.
 *
 * Assertions are plain DOM checks rather than jest-dom matchers — this repo
 * doesn't install jest-dom, and one spec is not a reason to add it.
 */

const button = () => screen.getByRole<HTMLButtonElement>("button");

describe("Button loading state", () => {
  /**
   * The reason `loading` exists rather than a label swap. A disabled button
   * cannot fire twice, and several of these submit forms or start payments —
   * "Refund", "Create course", "Buy now".
   */
  it("cannot be clicked twice while it is working", () => {
    const onClick = jest.fn();
    render(
      <Button loading onClick={onClick}>
        Refund
      </Button>,
    );

    fireEvent.click(button());

    expect(onClick).not.toHaveBeenCalled();
    expect(button().disabled).toBe(true);
  });

  /**
   * The old idiom replaced "Save changes" with "Saving…", which changed the
   * button's width mid-click and shifted whatever sat next to it.
   */
  it("keeps its own label while loading", () => {
    render(
      <Button loading loadingLabel="Saving…">
        Save changes
      </Button>,
    );

    expect(button().textContent).toContain("Save changes");
  });

  /** A changed label only says "busy" to people who can see it. */
  it("announces the work through a live region", () => {
    render(
      <Button loading loadingLabel="Saving…">
        Save changes
      </Button>,
    );

    expect(screen.getByRole("status").textContent).toBe("Saving…");
    expect(button().getAttribute("aria-busy")).toBe("true");
  });

  it("is clickable and unmarked when idle", () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Save changes</Button>);

    fireEvent.click(button());

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(button().disabled).toBe(false);
    expect(button().getAttribute("aria-busy")).toBeNull();
    expect(screen.queryByRole("status")).toBeNull();
  });

  /** An explicit `disabled` must still hold when `loading` is false. */
  it("respects an explicit disabled", () => {
    render(<Button disabled>Save</Button>);

    expect(button().disabled).toBe(true);
  });
});

describe("IconButton", () => {
  /**
   * These render a bare glyph — "↑", "×". Without the label a screen reader
   * announces "button" and nothing else, which is why `label` is required
   * rather than optional.
   */
  it("takes its accessible name from label, not the glyph", () => {
    render(<IconButton label="Move question up">↑</IconButton>);

    expect(
      screen.getByRole("button", { name: "Move question up" }),
    ).toBeDefined();
  });

  it("hides the glyph from assistive technology", () => {
    const { container } = render(<IconButton label="Remove">×</IconButton>);

    expect(container.querySelector("[aria-hidden]")?.textContent).toBe("×");
  });

  /** Defaults to type=button so one inside a form can't submit it. */
  it("never submits a form by accident", () => {
    render(<IconButton label="Remove row">×</IconButton>);

    expect(button().type).toBe("button");
  });
});

describe("Skeleton regions", () => {
  /**
   * The trap a naive skeleton falls into: replacing one polite "Loading…"
   * with a screenful of grey rectangles that either say nothing at all or
   * announce themselves one by one.
   */
  it("announces once for the whole block, not once per shape", () => {
    render(<SkeletonTable rows={5} columns={4} label="Loading orders…" />);

    const statuses = screen.getAllByRole("status");
    expect(statuses).toHaveLength(1);
    expect(statuses[0]?.textContent).toBe("Loading orders…");
  });

  it("marks the region busy and hides every placeholder shape", () => {
    const { container } = render(<SkeletonTable rows={2} columns={2} />);

    expect(screen.getByRole("status").getAttribute("aria-busy")).toBe("true");
    // 2 header cells + 2 rows x 2 body cells, every one hidden from the reader.
    expect(container.querySelectorAll("[aria-hidden]")).toHaveLength(6);
  });
});
