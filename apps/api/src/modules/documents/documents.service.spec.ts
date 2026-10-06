import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { Role } from "@pratikar/types";

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

  const buildService = (
    prisma: unknown,
    knowledgeBase = { reindex: jest.fn() },
  ) =>
    new DocumentsService(
      prisma as PrismaService,
      new AuditService(prisma as PrismaService),
      { send: jest.fn() } as unknown as NotificationSender,
      { signUrl: jest.fn() } as never,
      { add: jest.fn() } as never,
      knowledgeBase as never,
      { isConfigured: true } as never,
      { notifyUser: jest.fn() } as never,
    );

  /**
   * The chatbot must not keep recommending what was just unpublished, so
   * every save asks for a reindex — but only once the save has committed.
   */
  it("queues a reindex of the saved template", async () => {
    const { prisma } = buildPrisma({
      create: jest.fn().mockResolvedValue({ id: "tpl-1", title: "T" }),
    });
    const knowledgeBase = { reindex: jest.fn() };

    await buildService(prisma, knowledgeBase).upsertTemplate(dto, "user-9");

    expect(knowledgeBase.reindex).toHaveBeenCalledWith({
      sourceType: "template",
      sourceId: "tpl-1",
    });
  });

  it("does not queue a reindex when the save fails", async () => {
    const { prisma } = buildPrisma({
      findUnique: jest.fn().mockResolvedValue(null),
    });
    const knowledgeBase = { reindex: jest.fn() };

    await expect(
      buildService(prisma, knowledgeBase).upsertTemplate(dto, "user-9", "nope"),
    ).rejects.toThrow("TEMPLATE_NOT_FOUND");
    expect(knowledgeBase.reindex).not.toHaveBeenCalled();
  });

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
      { reindex: jest.fn() } as never,
      { isConfigured: true } as never,
      { notifyUser: jest.fn() } as never,
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

/**
 * These two are public. Everything they return is visible to anyone, so the
 * test is on what they ask the database for, not only on what comes back.
 */
describe("DocumentsService public catalogue", () => {
  const build = (rows: unknown) => {
    const prisma = {
      template: {
        findMany: jest.fn().mockResolvedValue(rows),
        findFirst: jest.fn().mockResolvedValue(rows),
      },
    };
    const service = new DocumentsService(
      prisma as unknown as PrismaService,
      new AuditService(prisma as unknown as PrismaService),
      { send: jest.fn() } as unknown as NotificationSender,
      { signUrl: jest.fn() } as never,
      { add: jest.fn() } as never,
      { reindex: jest.fn() } as never,
      { isConfigured: true } as never,
      { notifyUser: jest.fn() } as never,
    );
    return { service, prisma };
  };

  const selectedColumns = (mock: jest.Mock) =>
    Object.keys((mock.mock.calls[0] as [{ select: object }])[0].select).sort();

  const SAFE = [
    "category",
    "createdAt",
    "fieldSchema",
    "id",
    "priceInPaise",
    "reviewPriceInPaise",
    "status",
    "title",
  ];

  it("lists published templates without the file key or the author", async () => {
    const { service, prisma } = build([]);

    await service.listPublishedTemplates();

    expect(selectedColumns(prisma.template.findMany)).toEqual(SAFE);
    expect(prisma.template.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: "PUBLISHED" } }),
    );
  });

  it("returns one published template with the same columns", async () => {
    const { service, prisma } = build({ id: "tpl-1" });

    await service.getPublishedTemplate("tpl-1");

    expect(selectedColumns(prisma.template.findFirst)).toEqual(SAFE);
    expect(prisma.template.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "tpl-1", status: "PUBLISHED" } }),
    );
  });

  // A draft must not be previewable by guessing its id.
  it("404s for a template that is not published", async () => {
    const { service } = build(null);

    await expect(service.getPublishedTemplate("draft-1")).rejects.toThrow(
      NotFoundException,
    );
  });
});

/**
 * generate() is the one door every document goes through, however its answers
 * were collected. Bad answers must stop here, before a document exists.
 */
describe("DocumentsService.generate", () => {
  const TEMPLATE = {
    id: "tpl-1",
    status: "PUBLISHED",
    fieldSchema: [
      { key: "name", label: "Full name", type: "text", required: true },
      { key: "rent", label: "Monthly rent", type: "number", required: true },
    ],
  };

  const build = () => {
    const prisma = {
      template: { findUnique: jest.fn().mockResolvedValue(TEMPLATE) },
      generatedDocument: {
        create: jest
          .fn()
          .mockImplementation(({ data }: { data: object }) =>
            Promise.resolve({ id: "doc-1", ...data }),
          ),
      },
    };
    const queue = { add: jest.fn() };
    const service = new DocumentsService(
      prisma as unknown as PrismaService,
      new AuditService(prisma as unknown as PrismaService),
      { send: jest.fn() } as unknown as NotificationSender,
      { signUrl: jest.fn() } as never,
      queue as never,
      { reindex: jest.fn() } as never,
      { isConfigured: true } as never,
      { notifyUser: jest.fn() } as never,
    );
    return { service, prisma, queue };
  };

  it("stores only the cleaned answers", async () => {
    const { service, prisma } = build();

    await service.generate("u1", {
      templateId: "tpl-1",
      filledData: { name: "  A. Sen ", rent: "18,000", extra: "dropped" },
    });

    expect(prisma.generatedDocument.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        filledData: { name: "A. Sen", rent: 18000 },
      }) as unknown,
    });
  });

  it("refuses missing or malformed answers, and queues nothing", async () => {
    const { service, prisma, queue } = build();

    const attempt = service.generate("u1", {
      templateId: "tpl-1",
      filledData: { name: "", rent: "a lot" },
    });

    await expect(attempt).rejects.toThrow(BadRequestException);
    await expect(attempt).rejects.toMatchObject({
      response: {
        message: "INVALID_ANSWERS",
        problems: [
          { key: "name", label: "Full name", problem: "missing" },
          { key: "rent", label: "Monthly rent", problem: "not-a-number" },
        ],
      },
    });
    expect(prisma.generatedDocument.create).not.toHaveBeenCalled();
    expect(queue.add).not.toHaveBeenCalled();
  });
});

describe("DocumentsService preview and download", () => {
  const doc = (overrides: Record<string, unknown> = {}) => ({
    id: "doc-1",
    userId: "cust-1",
    status: "GENERATED",
    fileUrl: "documents/doc-1.docx",
    pdfFileUrl: "documents/doc-1.pdf",
    previewPageCount: 2,
    ...overrides,
  });

  const build = (row: unknown) => {
    const prisma = {
      generatedDocument: {
        findUnique: jest.fn().mockResolvedValue(row),
        update: jest.fn(),
      },
    };
    const storage = { signUrl: jest.fn((key: string) => `signed:${key}`) };
    const service = new DocumentsService(
      prisma as unknown as PrismaService,
      new AuditService(prisma as unknown as PrismaService),
      { send: jest.fn() } as unknown as NotificationSender,
      storage as never,
      { add: jest.fn() } as never,
      { reindex: jest.fn() } as never,
      { isConfigured: true } as never,
      { notifyUser: jest.fn() } as never,
    );
    return { service, prisma, storage };
  };

  it("gives the owner a link to each watermarked page", async () => {
    const { service } = build(doc());

    await expect(
      service.getPreview("doc-1", "cust-1", Role.CUSTOMER),
    ).resolves.toEqual({
      ready: true,
      pages: [
        "signed:documents/doc-1/preview-1.png",
        "signed:documents/doc-1/preview-2.png",
      ],
    });
  });

  // Never the clean file: the preview is free, the document is not.
  it("never signs the clean Word or PDF for a preview", async () => {
    const { service, storage } = build(doc());

    await service.getPreview("doc-1", "cust-1", Role.CUSTOMER);

    const signed = storage.signUrl.mock.calls.map(([key]) => key);
    expect(signed).not.toContain("documents/doc-1.docx");
    expect(signed).not.toContain("documents/doc-1.pdf");
  });

  it("says not ready while the worker is still generating", async () => {
    const { service } = build(doc({ fileUrl: "" }));

    await expect(
      service.getPreview("doc-1", "cust-1", Role.CUSTOMER),
    ).resolves.toEqual({ ready: false, pages: [] });
  });

  // A document holds someone's personal details.
  it("refuses another customer", async () => {
    const { service } = build(doc());

    await expect(
      service.getPreview("doc-1", "someone-else", Role.CUSTOMER),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("downloads both the Word file and the PDF in one go", async () => {
    const { service, prisma } = build(doc({ status: "PAID" }));

    await expect(
      service.consumeDownload("doc-1", "cust-1", Role.CUSTOMER),
    ).resolves.toEqual({
      fileUrl: "signed:documents/doc-1.docx",
      pdfUrl: "signed:documents/doc-1.pdf",
    });
    expect(prisma.generatedDocument.update).toHaveBeenCalled();
  });

  // Paying before the worker finishes must not spend the only download.
  it("keeps the download unspent when the file isn't ready yet", async () => {
    const { service, prisma } = build(doc({ status: "PAID", fileUrl: "" }));

    await expect(
      service.consumeDownload("doc-1", "cust-1", Role.CUSTOMER),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.generatedDocument.update).not.toHaveBeenCalled();
  });
});

describe("DocumentsService.queueReview", () => {
  const build = (lookup: unknown) => {
    const prisma = {
      documentReview: {
        create: jest.fn().mockResolvedValue({ id: "rev-1" }),
        findUnique: jest.fn().mockResolvedValue(lookup),
      },
    };
    const notifications = {
      send: jest.fn(),
      sendToStaff: jest.fn((build: (to: string) => unknown) =>
        Promise.resolve(build("team@example.com")),
      ),
    };
    const service = new DocumentsService(
      prisma as unknown as PrismaService,
      new AuditService(prisma as unknown as PrismaService),
      notifications as unknown as NotificationSender,
      { signUrl: jest.fn() } as never,
      { add: jest.fn() } as never,
      { reindex: jest.fn() } as never,
      { isConfigured: true } as never,
      { notifyUser: jest.fn() } as never,
    );
    return { service, notifications };
  };

  it("tells the team a review is waiting", async () => {
    const { service, notifications } = build({
      requestedBy: { name: "Asha" },
      generatedDocument: { template: { title: "Rent Agreement" } },
    });

    await service.queueReview("doc-1", "cust-1", "ord-1");

    const alert = notifications.sendToStaff.mock.results[0]
      ?.value as Promise<unknown>;
    await expect(alert).resolves.toEqual({
      type: "staff-review-requested",
      to: "team@example.com",
      payload: { customerName: "Asha", documentTitle: "Rent Agreement" },
    });
  });

  // The review is paid for and queued; a mail problem mustn't undo that.
  it("still queues the review when the alert fails", async () => {
    const { service, notifications } = build({
      requestedBy: { name: "Asha" },
      generatedDocument: { template: { title: "Rent Agreement" } },
    });
    notifications.sendToStaff.mockRejectedValue(new Error("redis down"));

    await expect(
      service.queueReview("doc-1", "cust-1", "ord-1"),
    ).resolves.toEqual({ id: "rev-1" });
    expect(notifications.sendToStaff).toHaveBeenCalled();
  });
});
