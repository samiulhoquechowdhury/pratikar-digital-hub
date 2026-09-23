import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";

import { DashboardTabs } from "./DashboardTabs";

const tabs = [
  { id: "documents", label: "Documents", count: 2, panel: <p>doc panel</p> },
  { id: "courses", label: "Courses", count: 1, panel: <p>course panel</p> },
  { id: "purchases", label: "Purchases", count: 5, panel: <p>buy panel</p> },
];

/**
 * The account page turned three stacked lists into tabs. Two things had to
 * survive that change, and neither is visible from a page render: the header
 * menu's deep links, and keyboard operation.
 */
describe("DashboardTabs", () => {
  beforeEach(() => {
    window.location.hash = "";
  });

  it("opens on the first tab and shows only its panel", () => {
    render(<DashboardTabs tabs={tabs} />);

    expect(screen.getByText("doc panel")).toBeDefined();
    expect(screen.queryByText("course panel")).toBeNull();
  });

  it("switches panels when a tab is clicked", () => {
    render(<DashboardTabs tabs={tabs} />);

    fireEvent.click(screen.getByRole("tab", { name: /Courses/ }));

    expect(screen.getByText("course panel")).toBeDefined();
    expect(screen.queryByText("doc panel")).toBeNull();
  });

  /**
   * The account menu links to /dashboard#purchases. Those used to be anchors
   * to headings; if the hash stopped selecting the tab, the menu would still
   * navigate but land on the wrong list — a broken promise with no error.
   */
  it("honours the hash the header menu links to", () => {
    window.location.hash = "#purchases";

    render(<DashboardTabs tabs={tabs} />);

    expect(screen.getByText("buy panel")).toBeDefined();
    expect(
      screen
        .getByRole("tab", { name: /Purchases/ })
        ?.getAttribute("aria-selected"),
    ).toBe("true");
  });

  it("follows a hash change while already on the page", () => {
    render(<DashboardTabs tabs={tabs} />);

    // Clicking the menu item from the dashboard changes only the hash, which
    // fires no navigation — so without the listener the tab would not move.
    window.location.hash = "#courses";
    fireEvent(window, new HashChangeEvent("hashchange"));

    expect(screen.getByText("course panel")).toBeDefined();
  });

  it("moves between tabs with the arrow keys, and wraps", () => {
    render(<DashboardTabs tabs={tabs} />);
    const first = screen.getByRole("tab", { name: /Documents/ });

    fireEvent.keyDown(first, { key: "ArrowRight" });
    expect(screen.getByText("course panel")).toBeDefined();

    // Left from the first tab wraps to the last rather than dead-ending.
    fireEvent.keyDown(screen.getByRole("tab", { name: /Courses/ }), {
      key: "ArrowLeft",
    });
    expect(screen.getByText("doc panel")).toBeDefined();

    fireEvent.keyDown(first, { key: "End" });
    expect(screen.getByText("buy panel")).toBeDefined();
  });

  /**
   * Roving tabindex: the whole tablist is one tab stop, so a keyboard user
   * reaches the panel in two presses rather than four.
   */
  it("keeps exactly one tab in the tab order", () => {
    render(<DashboardTabs tabs={tabs} />);

    const reachable = screen
      .getAllByRole("tab")
      .filter((t) => t.getAttribute("tabindex") === "0");

    expect(reachable).toHaveLength(1);
    expect(reachable[0]?.getAttribute("aria-selected")).toBe("true");
  });

  it("labels each panel with the tab that controls it", () => {
    render(<DashboardTabs tabs={tabs} />);

    const panel = screen.getByRole("tabpanel");
    const tab = screen.getByRole("tab", { selected: true });

    expect(panel?.getAttribute("aria-labelledby")).toBe(tab.id);
    expect(tab?.getAttribute("aria-controls")).toBe(panel.id);
  });
});
