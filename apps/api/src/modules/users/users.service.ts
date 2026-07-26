import { Injectable } from "@nestjs/common";
import type { Role } from "@pratikar/types";

import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findOrCreateByIdentifier(
    identifier: string,
    channel: "email" | "sms",
  ): Promise<{ user: { id: string; name: string | null; role: Role }; isNewUser: boolean }> {
    const where = channel === "email" ? { email: identifier } : { phone: identifier };
    const existing = await this.prisma.user.findUnique({ where });

    if (existing) {
      return {
        user: { id: existing.id, name: existing.name, role: existing.role as Role },
        isNewUser: false,
      };
    }

    const created = await this.prisma.user.create({
      data: channel === "email" ? { email: identifier } : { phone: identifier },
    });

    return {
      user: { id: created.id, name: created.name, role: created.role as Role },
      isNewUser: true,
    };
  }

  listAll() {
    return this.prisma.user.findMany({
      select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
  }

  getById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
    });
  }

  updateRole(id: string, role: Role) {
    return this.prisma.user.update({ where: { id }, data: { role } });
  }
}

