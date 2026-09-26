import { BadRequestException } from "@nestjs/common";

import type { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";

import { ContentLibraryService } from "./content-library.service";

/**
 * The bucket holds the library's stock and the app's own output side by side.
 * These pin the line between them: a customer's generated document or invoice
 * must never be offered for cataloguing, or catalogued if asked for anyway.
 */
describe("ContentLibraryService — the app's own files", () => {
  const object = (key: string) => ({
    key,
    sizeInBytes: 1024,
    lastModified: null,
  });

  const build = (keys: string[] = []) => {
    const prisma = {
      contentLibraryItem: {
        findMany: jest.fn().mockResolvedValue([]),
        createMany: jest.fn(),
        create: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    const storage = { list: jest.fn().mockResolvedValue(keys.map(object)) };
    const service = new ContentLibraryService(
      prisma as unknown as PrismaService,
      new AuditService(prisma as unknown as PrismaService),
      storage as never,
      { reindex: jest.fn() } as never,
    );
    return { service, prisma };
  };

  const item = (fileUrl: string) => ({
    title: "T",
    category: "LEGAL_PRACTICE" as const,
    type: "FORM" as const,
    priceInPaise: 100,
    fileUrl,
  });

  it("leaves them out of the storage listing, without counting them as skipped", async () => {
    const { service } = build([
      "affidavits/A.docx",
      "documents/3f2a.docx",
      "invoices/9c1b.pdf",
      "credit-notes/77aa.pdf",
      "templates/1790000000000-A.docx",
    ]);

    const result = await service.listStorageObjects();

    expect(result.objects.map((o) => o.key)).toEqual(["affidavits/A.docx"]);
    expect(result.totalObjects).toBe(1);
    expect(result.skippedUnsupported).toBe(0);
  });

  it("refuses to import one, and imports nothing from that batch", async () => {
    const { service, prisma } = build();

    await expect(
      service.importFromStorage(
        {
          items: [item("affidavits/A.docx"), item("invoices/9c1b.pdf")],
          publish: true,
        },
        "user-1",
      ),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("refuses to catalogue one through the single-item form", async () => {
    const { service, prisma } = build();

    await expect(
      service.upsert(item("documents/3f2a.docx") as never, "user-1"),
    ).rejects.toThrow("Not a library file: documents/3f2a.docx");
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});

/**
 * createMany returns no ids, so a publish-on-import batch has to look its
 * rows up again before it can ask for them to be indexed.
 */
describe("ContentLibraryService.importFromStorage — knowledge base", () => {
  const item = (fileUrl: string) => ({
    title: "T",
    category: "LEGAL_PRACTICE" as const,
    type: "FORM" as const,
    priceInPaise: 100,
    fileUrl,
  });

  const build = () => {
    const tx = {
      contentLibraryItem: { createMany: jest.fn() },
      auditLog: { create: jest.fn() },
    };
    const prisma = {
      contentLibraryItem: {
        findMany: jest
          .fn()
          // First call: which keys already exist. Second: the new rows' ids.
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([{ id: "i1" }, { id: "i2" }]),
      },
      $transaction: jest.fn((cb: (client: typeof tx) => unknown) => cb(tx)),
    };
    const knowledgeBase = { reindex: jest.fn() };
    const service = new ContentLibraryService(
      prisma as unknown as PrismaService,
      new AuditService(prisma as unknown as PrismaService),
      { list: jest.fn() } as never,
      knowledgeBase as never,
    );
    return { service, prisma, knowledgeBase };
  };

  it("queues every row of a published batch", async () => {
    const { service, knowledgeBase } = build();

    await service.importFromStorage(
      { items: [item("a/1.pdf"), item("a/2.pdf")], publish: true },
      "user-1",
    );

    expect(knowledgeBase.reindex).toHaveBeenCalledWith(
      { sourceType: "content", sourceId: "i1" },
      { sourceType: "content", sourceId: "i2" },
    );
  });

  // Drafts are not indexed, so the id lookup would be wasted.
  it("skips the lookup for a draft import", async () => {
    const { service, prisma, knowledgeBase } = build();

    await service.importFromStorage(
      { items: [item("a/1.pdf")], publish: false },
      "user-1",
    );

    expect(prisma.contentLibraryItem.findMany).toHaveBeenCalledTimes(1);
    expect(knowledgeBase.reindex).not.toHaveBeenCalled();
  });
});
