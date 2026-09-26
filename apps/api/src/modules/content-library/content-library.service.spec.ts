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
