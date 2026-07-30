import { NotFoundException } from "@nestjs/common";

import type { PrismaService } from "../../prisma/prisma.service";
import {
  AuditAction,
  AuditService,
  AuditTargetType,
} from "../audit/audit.service";

import { DocumentsService } from "./documents.service";
import type { UpsertTemplateDto } from "./dto/upsert-template.dto";

/**
 * Covers the audit guarantee for template mutations (docs/srs.md Section 6,
 * docs/implementation-plan.md Milestone 2 item 5): every create/update writes
 * an AuditLog row, in the same transaction as the write it describes, so the
 * two can never diverge.
 */
describe("DocumentsService template mutations", () => {
  const dto: UpsertTemplateDto = {
    title: "Rent Agreement",
    category: "property",
    priceInPaise: 19900,
    reviewPriceInPaise: 99900,
    fieldSchema: [
      { key: "landlordName", label: "Landlord", type: "text", required: true },
    ],
    status: "DRAFT",
  };

  /**
   * $transaction runs the callback against a client that stands in for the
   * transactional one. Both the template write and the audit write must go
   * through this same object — that's the property under test.
   */
  const buildPrisma = (
    template: Partial<Record<"findUnique" | "update" | "create", jest.Mock>>,
  ) => {
    const tx = {
      template: {
        findUnique: template.findUnique ?? jest.fn(),
        update: template.update ?? jest.fn(),
        create: template.create ?? jest.fn(),
      },
      auditLog: { create: jest.fn() },
    };
    const prisma = {
      $transaction: jest.fn((cb: (client: typeof tx) => unknown) => cb(tx)),
    };
    return { prisma, tx };
  };

  const buildService = (prisma: unknown) =>
    new DocumentsService(
      prisma as PrismaService,
      new AuditService(prisma as PrismaService),
      { signUrl: jest.fn() } as never,
      { add: jest.fn() } as never,
    );

  it("writes a TEMPLATE_CREATED entry naming the actor and the new template", async () => {
    const created = { id: "tpl-1", title: dto.title, status: "DRAFT" };
    const { prisma, tx } = buildPrisma({
      create: jest.fn().mockResolvedValue(created),
    });

    await buildService(prisma).upsertTemplate(dto, "user-9");

    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: {
        actorUserId: "user-9",
        action: AuditAction.TEMPLATE_CREATED,
        targetType: AuditTargetType.TEMPLATE,
        targetId: "tpl-1",
        metadata: { title: "Rent Agreement", status: "DRAFT" },
      },
    });
  });

  it("records the status transition on update, since publishing is the reviewable act", async () => {
    const { prisma, tx } = buildPrisma({
      findUnique: jest.fn().mockResolvedValue({ id: "tpl-1", status: "DRAFT" }),
      update: jest.fn().mockResolvedValue({
        id: "tpl-1",
        title: "Rent Agreement",
        status: "PUBLISHED",
      }),
    });

    await buildService(prisma).upsertTemplate(
      { ...dto, status: "PUBLISHED" },
      "user-9",
      "tpl-1",
    );

    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: {
        actorUserId: "user-9",
        action: AuditAction.TEMPLATE_UPDATED,
        targetType: AuditTargetType.TEMPLATE,
        targetId: "tpl-1",
        metadata: {
          title: "Rent Agreement",
          statusFrom: "DRAFT",
          statusTo: "PUBLISHED",
        },
      },
    });
  });

  it("writes the audit row through the transaction client, not a separate connection", async () => {
    const { prisma, tx } = buildPrisma({
      create: jest
        .fn()
        .mockResolvedValue({ id: "tpl-1", title: "t", status: "DRAFT" }),
    });

    await buildService(prisma).upsertTemplate(dto, "user-9");

    // If this ever regressed to a standalone write, a rolled-back template
    // create could still leave an audit row claiming it happened.
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.auditLog.create).toHaveBeenCalledTimes(1);
  });

  it("rejects an update to a missing template without logging one", async () => {
    const { prisma, tx } = buildPrisma({
      findUnique: jest.fn().mockResolvedValue(null),
    });

    await expect(
      buildService(prisma).upsertTemplate(dto, "user-9", "nope"),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(tx.template.update).not.toHaveBeenCalled();
    expect(tx.auditLog.create).not.toHaveBeenCalled();
  });
});
