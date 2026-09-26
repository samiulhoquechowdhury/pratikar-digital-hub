import type { Job } from "bullmq";

import type { PrismaService } from "../../../prisma/prisma.service";

import { KnowledgeBaseIndexProcessor } from "./knowledge-base-index.processor";
import {
  contentHash,
  describeTemplate,
  KNOWLEDGE_BASE_DIMENSIONS,
  type KnowledgeSourceRef,
} from "./sources";
import type { VoyageEmbedder } from "./voyage-embedder.service";

describe("KnowledgeBaseIndexProcessor", () => {
  const MODEL = "voyage-4";
  const template = {
    id: "tpl-1",
    title: "Rent Agreement",
    category: "property",
    fieldSchema: [{ key: "rent", label: "Monthly rent" }],
    status: "PUBLISHED",
  };

  const build = ({
    row = template,
    indexedHash = null,
    configured = true,
  }: {
    row?: object | null;
    indexedHash?: string | null;
    configured?: boolean;
  } = {}) => {
    const prisma = {
      template: { findUnique: jest.fn().mockResolvedValue(row) },
      course: { findUnique: jest.fn().mockResolvedValue(row) },
      contentLibraryItem: { findUnique: jest.fn().mockResolvedValue(row) },
      knowledgeBaseDocument: {
        findUnique: jest
          .fn()
          .mockResolvedValue(indexedHash ? { contentHash: indexedHash } : null),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      $executeRaw: jest.fn().mockResolvedValue(1),
    };
    const embedder = {
      model: MODEL,
      isConfigured: configured,
      embedDocuments: jest
        .fn()
        .mockResolvedValue([Array(KNOWLEDGE_BASE_DIMENSIONS).fill(0.5)]),
    };
    const processor = new KnowledgeBaseIndexProcessor(
      prisma as unknown as PrismaService,
      embedder as unknown as VoyageEmbedder,
    );
    return { processor, prisma, embedder };
  };

  const job = (
    ref: KnowledgeSourceRef = { sourceType: "template", sourceId: "tpl-1" },
  ) => ({ data: ref }) as Job<KnowledgeSourceRef>;

  it("embeds a published template and upserts it", async () => {
    const { processor, prisma, embedder } = build();

    await expect(processor.process(job())).resolves.toBe("indexed");

    expect(embedder.embedDocuments).toHaveBeenCalledWith([
      describeTemplate(template),
    ]);
    expect(prisma.$executeRaw).toHaveBeenCalledTimes(1);
  });

  it.each(["DRAFT", "ARCHIVED"])(
    "removes a %s template from the index",
    async (status) => {
      const { processor, prisma, embedder } = build({
        row: { ...template, status },
      });

      await expect(processor.process(job())).resolves.toBe("removed");

      expect(prisma.knowledgeBaseDocument.deleteMany).toHaveBeenCalledWith({
        where: { sourceType: "template", sourceId: "tpl-1" },
      });
      expect(embedder.embedDocuments).not.toHaveBeenCalled();
    },
  );

  it("removes a source that no longer exists", async () => {
    const { processor, prisma } = build({ row: null });

    await expect(
      processor.process(job({ sourceType: "course", sourceId: "gone" })),
    ).resolves.toBe("removed");
    expect(prisma.knowledgeBaseDocument.deleteMany).toHaveBeenCalled();
  });

  // Saving a template without changing what is indexed must not cost an API call.
  it("skips the embedding call when the content is unchanged", async () => {
    const { processor, prisma, embedder } = build({
      indexedHash: contentHash(MODEL, describeTemplate(template)),
    });

    await expect(processor.process(job())).resolves.toBe("unchanged");

    expect(embedder.embedDocuments).not.toHaveBeenCalled();
    expect(prisma.$executeRaw).not.toHaveBeenCalled();
  });

  it("re-embeds when the stored hash is from different content", async () => {
    const { processor, embedder } = build({ indexedHash: "stale" });

    await expect(processor.process(job())).resolves.toBe("indexed");
    expect(embedder.embedDocuments).toHaveBeenCalled();
  });

  it("skips rather than fails when no Voyage key is configured", async () => {
    const { processor, prisma, embedder } = build({ configured: false });

    await expect(processor.process(job())).resolves.toBe("skipped");

    expect(embedder.embedDocuments).not.toHaveBeenCalled();
    expect(prisma.$executeRaw).not.toHaveBeenCalled();
  });

  // Unpublishing must work in every environment, key or no key.
  it("still removes without a Voyage key", async () => {
    const { processor, prisma } = build({
      configured: false,
      row: { ...template, status: "ARCHIVED" },
    });

    await expect(processor.process(job())).resolves.toBe("removed");
    expect(prisma.knowledgeBaseDocument.deleteMany).toHaveBeenCalled();
  });

  // A failed embedding has to reach BullMQ, whose retry is the whole recovery.
  it("lets an embedding failure throw, so the queue retries", async () => {
    const { processor, embedder, prisma } = build();
    embedder.embedDocuments.mockRejectedValue(new Error("VOYAGE_ERROR_429"));

    await expect(processor.process(job())).rejects.toThrow("VOYAGE_ERROR_429");
    expect(prisma.$executeRaw).not.toHaveBeenCalled();
  });
});
