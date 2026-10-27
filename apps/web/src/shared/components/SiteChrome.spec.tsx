import { render, screen } from "@testing-library/react";
import React from "react";

import { isBarePath, SiteChrome } from "./SiteChrome";

let pathname = "/";
jest.mock("next/navigation", () => ({ usePathname: () => pathname }));

const renderAt = (path: string) => {
  pathname = path;
  return render(
    <SiteChrome
      header={<header>nav</header>}
      footer={<footer>foot</footer>}
      floating={<button type="button">Pratikar AI</button>}
    >
      <p>page</p>
    </SiteChrome>,
  );
};

describe("SiteChrome", () => {
  it.each(["/login", "/signup", "/login/"])("is bare on %s", (path) => {
    expect(isBarePath(path)).toBe(true);
  });

  it.each(["/", "/documents", "/login-help", "/dashboard/login"])(
    "keeps the chrome on %s",
    (path) => {
      expect(isBarePath(path)).toBe(false);
    },
  );

  it("leaves out the nav, footer and assistant on sign-in", () => {
    renderAt("/login");
    expect(screen.getByText("page")).toBeTruthy();
    expect(screen.queryByText("nav")).toBeNull();
    expect(screen.queryByText("foot")).toBeNull();
    expect(screen.queryByRole("button", { name: "Pratikar AI" })).toBeNull();
  });

  it("shows them everywhere else", () => {
    renderAt("/documents");
    expect(screen.getByText("nav")).toBeTruthy();
    expect(screen.getByText("foot")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Pratikar AI" })).toBeTruthy();
  });
});
