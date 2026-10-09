import { NotFoundException } from "@nestjs/common";

import type { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";

import { FaqService } from "./faq.service";

const DTO = {
  question: "  How do downloads work? ",
  answer: "  Once, for template documents. ",
  category: "Documents",
  order: 1,
  published: true,
};

function build(
  existing: object | null = { id: "f1", question: "Q", published: false },
) {
  const faq = {
    create: jest.fn(({ data }: { data: object }) =>
      Promise.resolve({ id: "f1", ...data }),
    ),
    update: jest.fn(({ data }: { data: object }) =>
      Promise.resolve({ id: "f1", ...data }),
    ),
    delete: jest.fn(),
    findUnique: jest.fn(() => Promise.resolve(existing)),
    findMany: jest.fn(() =>
      Promise.resolve([
        { id: "a", question: "Q1", answer: "A1", category: "Documents" },
        { id: "b", question: "Q2", answer: "A2", category: "Documents" },
        { id: "c", question: "Q3", answer: "A3", category: "Payments" },
      ]),
    ),
  };
  const prisma = { faq, auditLog: { create: jest.fn() } };
  const db = {
    ...prisma,
    $transaction: jest.fn((cb: (tx: typeof prisma) => unknown) => cb(prisma)),
  };
  const knowledgeBase = { reindex: jest.fn() };
  const service = new FaqService(
    db as unknown as PrismaService,
    new AuditService(db as unknown as PrismaService),
    knowledgeBase as never,
  );
  return { service, faq, knowledgeBase };
}

describe("FaqService", () => {
  it("trims what it saves, and re-indexes the entry", async () => {
    const { service, faq, knowledgeBase } = build();

    await service.create(DTO, "u1");

    expect(faq.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        question: "How do downloads work?",
      }) as object,
    });
    expect(knowledgeBase.reindex).toHaveBeenCalledWith({
      sourceType: "faq",
      sourceId: "f1",
    });
  });

  // The assistant must stop quoting a deleted answer.
  it("re-indexes on delete, so the entry leaves the assistant too", async () => {
    const { service, knowledgeBase } = build();

    await service.remove("f1", "u1");

    expect(knowledgeBase.reindex).toHaveBeenCalledWith({
      sourceType: "faq",
      sourceId: "f1",
    });
  });

  it("404s an unknown entry", async () => {
    const { service } = build(null);
    await expect(service.update("x", DTO, "u1")).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("groups the public page by category", async () => {
    const { service } = build();

    const groups = await service.published();

    expect(groups.map((g) => [g.category, g.items.length])).toEqual([
      ["Documents", 2],
      ["Payments", 1],
    ]);
  });
});
