import type { AuthenticatedUser } from "@pratikar/types";
import { Role } from "@pratikar/types";

import { STAFF_ROLES, isStaff } from "./staff";

const asUser = (role: Role): AuthenticatedUser =>
  ({ id: "u1", role }) as AuthenticatedUser;

/**
 * This decides who gets into the panel, and it now runs on the silent path
 * too — restoring a session from the refresh cookie on reload, where nobody is
 * watching a form submit. Worth pinning role by role rather than trusting the
 * list to stay right.
 */
describe("isStaff", () => {
  it.each([Role.SUPPORT, Role.CONTENT_MANAGER, Role.ADMIN, Role.SUPER_ADMIN])(
    "admits %s",
    (role) => {
      expect(isStaff(asUser(role))).toBe(true);
    },
  );

  /**
   * A customer holds a perfectly valid refresh cookie from the storefront —
   * same auth system, same cookie domain in development. Restoring it here
   * would drop them into a shell where every request 403s.
   */
  it("refuses a customer", () => {
    expect(isStaff(asUser(Role.CUSTOMER))).toBe(false);
  });

  // Support was kept out until the requirements' role matrix was applied:
  // it handles customer tickets, so it needs the accounts and orders the
  // API already lets it read. What it may open inside is in sections.ts.
  it("admits SUPPORT, for customer care", () => {
    expect(STAFF_ROLES).toContain(Role.SUPPORT);
  });

  it("refuses nobody-signed-in", () => {
    expect(isStaff(null)).toBe(false);
  });
});
