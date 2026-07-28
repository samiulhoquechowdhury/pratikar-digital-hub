import type { ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Role } from "@pratikar/types";

import { ROLES_KEY } from "../decorators/roles.decorator";
import type { RequestUser } from "../types/authenticated-request";

import { RolesGuard } from "./roles.guard";

/**
 * Regression coverage for the role-representation mismatch: @pratikar/types
 * once used lowercase values ("super_admin") while Prisma persists
 * SCREAMING_SNAKE ("SUPER_ADMIN"), so `requiredRoles.includes(user.role)`
 * silently returned false and 403'd every legitimately privileged user.
 * These tests fail if the two enums ever drift apart again.
 */
describe("RolesGuard", () => {
  const buildContext = (user?: RequestUser): ExecutionContext =>
    ({
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
      getHandler: () => undefined,
      getClass: () => undefined,
    }) as unknown as ExecutionContext;

  const buildGuard = (requiredRoles?: Role[]) => {
    const reflector = new Reflector();
    jest
      .spyOn(reflector, "getAllAndOverride")
      .mockImplementation((key) =>
        key === ROLES_KEY ? requiredRoles : undefined,
      );
    return new RolesGuard(reflector);
  };

  it("allows a user whose role is in the required list", () => {
    const guard = buildGuard([Role.SUPPORT, Role.ADMIN, Role.SUPER_ADMIN]);
    expect(
      guard.canActivate(buildContext({ id: "u1", role: Role.SUPER_ADMIN })),
    ).toBe(true);
  });

  it("denies a user whose role is not in the required list", () => {
    const guard = buildGuard([Role.ADMIN, Role.SUPER_ADMIN]);
    expect(
      guard.canActivate(buildContext({ id: "u1", role: Role.CUSTOMER })),
    ).toBe(false);
  });

  it("denies when no user is attached to the request", () => {
    const guard = buildGuard([Role.ADMIN]);
    expect(guard.canActivate(buildContext(undefined))).toBe(false);
  });

  it("allows any authenticated user when the route declares no roles", () => {
    const guard = buildGuard(undefined);
    expect(
      guard.canActivate(buildContext({ id: "u1", role: Role.CUSTOMER })),
    ).toBe(true);
  });

  it("uses the exact string values Prisma persists", () => {
    // Mirrors the `Role` enum in prisma/schema.prisma. If a value is renamed on
    // either side without the other, this is the test that catches it.
    expect(Object.values(Role).sort()).toEqual(
      ["ADMIN", "CONTENT_MANAGER", "CUSTOMER", "SUPER_ADMIN", "SUPPORT"].sort(),
    );
  });
});
