import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service";
import { UpsertContentItemDto } from "./dto/upsert-content-item.dto";

@Injectable()
export class ContentLibraryService {
  constructor(private readonly prisma: PrismaService) {}

  // Re-download policy for this module is still open (docs/srs.md Section 8)
  // — unlike Documents, there's no one-time-use enforcement here yet.

  listPublished(category?: string) {
    return this.prisma.contentLibraryItem.findMany({
      where: { status: "PUBLISHED", ...(category ? { category: category as never } : {}) },
      orderBy: { createdAt: "desc" },
    });
  }

  async upsert(dto: UpsertContentItemDto, itemId?: string) {
    if (itemId) {
      return this.prisma.contentLibraryItem.update({ where: { id: itemId }, data: dto });
    }
    return this.prisma.contentLibraryItem.create({ data: dto });
  }
}
