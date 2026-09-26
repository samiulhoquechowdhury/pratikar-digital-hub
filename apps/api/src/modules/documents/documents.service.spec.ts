import { NotFoundException } from "@nestjs/common";

import type { PrismaService } from "../../prisma/prisma.service";
import {
  AuditAction,
  AuditService,
  AuditTargetType,
} from "../audit/audit.service";
import type { NotificationSender } from "../notifications/notification-sender.service";

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
      { send: jest.fn() } as unknown as NotificationSender,
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

/**
 * The picker that feeds the tagging screen. Its job is to answer two
 * questions about the bucket — what can be tagged, and what already has been.
 */
describe("DocumentsService.listTaggableStorage", () => {
  const object = (key: string) => ({
    key,
    sizeInBytes: 1024,
    lastModified: null,
  });

  const build = (keys: string[], templates: unknown[] = []) => {
    const storage = { list: jest.fn().mockResolvedValue(keys.map(object)) };
    const prisma = {
      template: { findMany: jest.fn().mockResolvedValue(templates) },
    };
    const service = new DocumentsService(
      prisma as unknown as PrismaService,
      new AuditService(prisma as unknown as PrismaService),
      { send: jest.fn() } as unknown as NotificationSender,
      storage as never,
      { add: jest.fn() } as never,
    );
    return { service, storage };
  };

  it("keeps .docx and counts the rest as skipped", async () => {
    const { service } = build([
      "affidavits/GENERAL AFFIDAVIT.docx",
      "e-books/guide.pdf",
      "sheets/rates.xlsx",
    ]);

    const result = await service.listTaggableStorage();

    expect(result.objects.map((o) => o.key)).toEqual([
      "affidavits/GENERAL AFFIDAVIT.docx",
    ]);
    // Reported rather than dropped silently, so the screen can explain why
    // the bucket looks smaller here than it does in the content library.
    expect(result.totalObjects).toBe(3);
    expect(result.skippedUnsupported).toBe(2);
  });

  it("leaves out what the app wrote itself, without counting it as skipped", async () => {
    const { service } = build([
      "affidavits/A.docx",
      // A customer's generated document — their name and address, filled in.
      "documents/3f2a.docx",
      // A tagged copy, which has no blanks left to name.
      "templates/1790000000000-A.docx",
      "invoices/9c1b.pdf",
      "credit-notes/77aa.pdf",
    ]);

    const result = await service.listTaggableStorage();

    expect(result.objects.map((o) => o.key)).toEqual(["affidavits/A.docx"]);
    expect(result.totalObjects).toBe(1);
    expect(result.skippedUnsupported).toBe(0);
  });

  it("matches case-insensitively, because the bucket has both", async () => {
    const { service } = build(["agreements/NDA AGREEMENT.DOCX"]);

    expect((await service.listTaggableStorage()).objects).toHaveLength(1);
  });

  it("attaches the template already built from a form, and null elsewhere", async () => {
    const { service } = build(
      ["affidavits/A.docx", "affidavits/B.docx"],
      [
        {
          id: "tpl-1",
          title: "Affidavit A",
          sourceKey: "affidavits/A.docx",
          status: "DRAFT",
        },
      ],
    );

    const [a, b] = (await service.listTaggableStorage()).objects;

    expect(a?.template).toEqual({
      id: "tpl-1",
      title: "Affidavit A",
      status: "DRAFT",
    });
    expect(b?.template).toBeNull();
  });

  it("suggests a title and folder from the key", async () => {
    const { service } = build(["affidavits/ADDRESS PROOF AFFIDAVIT.docx"]);

    const [only] = (await service.listTaggableStorage()).objects;

    expect(only?.suggestedTitle).toBe("Address Proof Affidavit");
    expect(only?.folder).toBe("affidavits");
  });

  it("sorts by key, so a folder's files stay together", async () => {
    const { service } = build([
      "notices/Z.docx",
      "affidavits/B.docx",
      "affidavits/A.docx",
    ]);

    expect(
      (await service.listTaggableStorage()).objects.map((o) => o.key),
    ).toEqual(["affidavits/A.docx", "affidavits/B.docx", "notices/Z.docx"]);
  });

  it("passes a prefix through to storage, and defaults to the whole bucket", async () => {
    const { service, storage } = build([]);

    await service.listTaggableStorage("affidavits/");
    expect(storage.list).toHaveBeenCalledWith("affidavits/");

    await service.listTaggableStorage();
    expect(storage.list).toHaveBeenLastCalledWith("");
  });
});
