import { Role } from "@pratikar/types";

import { mayOpen, sectionsFor } from "./sections";

const hrefs = (role: Role) => sectionsFor(role).map((s) => s.href);

describe("admin sections", () => {
  it("gives Support customer care only", () => {
    expect(hrefs(Role.SUPPORT)).toEqual(["/orders", "/users"]);
  });

  // Content Managers have no access to payments or accounts (SRS 2).
  it("keeps Content Managers out of orders and users", () => {
    expect(hrefs(Role.CONTENT_MANAGER)).not.toContain("/orders");
    expect(hrefs(Role.CONTENT_MANAGER)).not.toContain("/users");
    expect(hrefs(Role.CONTENT_MANAGER)).toContain("/reviews");
  });

  it("gives Admins everything", () => {
    expect(hrefs(Role.ADMIN)).toHaveLength(10);
  });

  it("gates nested pages by their section", () => {
    expect(mayOpen(Role.SUPPORT, "/courses/abc/modules/1/quiz")).toBe(false);
    expect(mayOpen(Role.SUPPORT, "/orders")).toBe(true);
    expect(mayOpen(Role.SUPPORT, "/")).toBe(true);
  });
});
