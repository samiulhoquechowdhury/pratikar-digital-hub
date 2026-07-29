import { NotFoundException } from "@nestjs/common";
import { Role } from "@pratikar/types";

import type { PrismaService } from "../../prisma/prisma.service";
import {
  AuditAction,
  AuditService,
  AuditTargetType,
} from "../audit/audit.service";

import { UsersService } from "./users.service";

/**
 * Role changes are the most privilege-sensitive action in the admin panel —
 * this is how an account gains the ability to refund money. The audit row has
 * to name the actor and both roles, and must not survive a failed change.
 */
describe("UsersService.updateRole", () => {
  const buildPrisma = (findUnique: jest.Mock, update = jest.fn()) => {
    const tx = {
      user: { findUnique, update },
      auditLog: { create: jest.fn() },
    };
    const prisma = {
      $transaction: jest.fn((cb: (client: typeof tx) => unknown) => cb(tx)),
    };
    return { prisma, tx };
  };

  const buildService = (prisma: unknown) =>
    new UsersService(
      prisma as PrismaService,
      new AuditService(prisma as PrismaService),
    );

  it("records both the previous and the new role", async () => {
    const { prisma, tx } = buildPrisma(
      jest.fn().mockResolvedValue({ id: "u-1", role: Role.CUSTOMER }),
      jest.fn().mockResolvedValue({ id: "u-1", role: Role.CONTENT_MANAGER }),
    );

    await buildService(prisma).updateRole(
      "u-1",
      Role.CONTENT_MANAGER,
      "admin-1",
    );

    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: {
        actorUserId: "admin-1",
        action: AuditAction.USER_ROLE_CHANGED,
        targetType: AuditTargetType.USER,
        targetId: "u-1",
        metadata: { roleFrom: Role.CUSTOMER, roleTo: Role.CONTENT_MANAGER },
      },
    });
  });

  it("rejects an unknown user without logging a privilege change", async () => {
    const { prisma, tx } = buildPrisma(jest.fn().mockResolvedValue(null));

    await expect(
      buildService(prisma).updateRole("ghost", Role.ADMIN, "admin-1"),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(tx.user.update).not.toHaveBeenCalled();
    expect(tx.auditLog.create).not.toHaveBeenCalled();
  });

  it("writes the audit row inside the same transaction as the change", async () => {
    const { prisma, tx } = buildPrisma(
      jest.fn().mockResolvedValue({ id: "u-1", role: Role.CUSTOMER }),
      jest.fn().mockResolvedValue({ id: "u-1", role: Role.SUPER_ADMIN }),
    );

    await buildService(prisma).updateRole("u-1", Role.SUPER_ADMIN, "admin-1");

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.auditLog.create).toHaveBeenCalledTimes(1);
  });
});
