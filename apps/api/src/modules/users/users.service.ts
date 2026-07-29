import { Injectable, NotFoundException } from "@nestjs/common";
import type { Role } from "@pratikar/types";

import { PrismaService } from "../../prisma/prisma.service";
import {
  AuditAction,
  AuditService,
  AuditTargetType,
} from "../audit/audit.service";

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findOrCreateByIdentifier(
    identifier: string,
    channel: "email" | "sms",
  ): Promise<{
    user: { id: string; name: string | null; role: Role };
    isNewUser: boolean;
  }> {
    const where =
      channel === "email" ? { email: identifier } : { phone: identifier };
    const existing = await this.prisma.user.findUnique({ where });

    if (existing) {
      return {
        user: { id: existing.id, name: existing.name, role: existing.role },
        isNewUser: false,
      };
    }

    const created = await this.prisma.user.create({
      data: channel === "email" ? { email: identifier } : { phone: identifier },
    });

    return {
      user: { id: created.id, name: created.name, role: created.role },
      isNewUser: true,
    };
  }

  listAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  getById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });
  }

  /**
   * Privilege changes are the single most sensitive admin action here — this
   * is how someone becomes able to refund money or publish templates — so the
   * audit row records both the old and new role, in the same transaction as
   * the change itself.
   */
  async updateRole(id: string, role: Role, actorUserId: string) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.user.findUnique({ where: { id } });
      if (!existing) throw new NotFoundException("USER_NOT_FOUND");

      const updated = await tx.user.update({ where: { id }, data: { role } });

      await this.audit.recordWith(tx, {
        actorUserId,
        action: AuditAction.USER_ROLE_CHANGED,
        targetType: AuditTargetType.USER,
        targetId: updated.id,
        metadata: { roleFrom: existing.role, roleTo: updated.role },
      });

      return updated;
    });
  }
}
