import type { PrismaService } from "../../../prisma/prisma.service";

import { KnowledgeBaseIndexer } from "./knowledge-base-indexer.service";

describe("KnowledgeBaseIndexer", () => {
  const build = ({
    templates = [] as { id: string }[],
    courses = [] as { id: string }[],
    items = [] as { id: string }[],
    indexed = [] as { sourceType: string; sourceId: string }[],
  } = {}) => {
    const queue = { addBulk: jest.fn().mockResolvedValue([]) };
    const prisma = {
      template: { findMany: jest.fn().mockResolvedValue(templates) },
      course: { findMany: jest.fn().mockResolvedValue(courses) },
      contentLibraryItem: { findMany: jest.fn().mockResolvedValue(items) },
      knowledgeBaseDocument: { findMany: jest.fn().mockResolvedValue(indexed) },
    };
    const indexer = new KnowledgeBaseIndexer(
      queue as never,
      prisma as unknown as PrismaService,
    );
    return { indexer, queue };
  };

  const queuedRefs = (queue: { addBulk: jest.Mock }) => {
    const [jobs] = queue.addBulk.mock.calls[0] as [{ data: unknown }[]];
    return jobs.map((j) => j.data);
  };

  describe("reindex", () => {
    it("queues one job per source", async () => {
      const { indexer, queue } = build();

      await indexer.reindex(
        { sourceType: "template", sourceId: "a" },
        { sourceType: "course", sourceId: "b" },
      );

      expect(queue.addBulk).toHaveBeenCalledWith([
        { name: "template:a", data: { sourceType: "template", sourceId: "a" } },
        { name: "course:b", data: { sourceType: "course", sourceId: "b" } },
      ]);
    });

    // The caller's save has already committed; Redis being down must not
    // turn it into an apparent failure.
    it("swallows a queue failure", async () => {
      const { indexer, queue } = build();
      queue.addBulk.mockRejectedValue(new Error("ECONNREFUSED"));

      await expect(
        indexer.reindex({ sourceType: "template", sourceId: "a" }),
      ).resolves.toBeUndefined();
    });

    it("does nothing for an empty list", async () => {
      const { indexer, queue } = build();

      await indexer.reindex();

      expect(queue.addBulk).not.toHaveBeenCalled();
    });
  });

  describe("reindexAll", () => {
    it("queues every source of every type", async () => {
      const { indexer, queue } = build({
        templates: [{ id: "t1" }],
        courses: [{ id: "c1" }],
        items: [{ id: "i1" }],
      });

      await expect(indexer.reindexAll()).resolves.toEqual({ queued: 3 });
      expect(queuedRefs(queue)).toEqual([
        { sourceType: "template", sourceId: "t1" },
        { sourceType: "course", sourceId: "c1" },
        { sourceType: "content", sourceId: "i1" },
      ]);
    });

    // What makes it a repair: an entry whose source has gone still gets a
    // job, and the job removes it.
    it("also visits orphaned index entries, once each", async () => {
      const { indexer, queue } = build({
        templates: [{ id: "t1" }],
        indexed: [
          { sourceType: "template", sourceId: "t1" },
          { sourceType: "course", sourceId: "deleted" },
        ],
      });

      await expect(indexer.reindexAll()).resolves.toEqual({ queued: 2 });
      expect(queuedRefs(queue)).toContainEqual({
        sourceType: "course",
        sourceId: "deleted",
      });
    });

    it("lets a queue failure reach the operator", async () => {
      const { indexer, queue } = build({ templates: [{ id: "t1" }] });
      queue.addBulk.mockRejectedValue(new Error("ECONNREFUSED"));

      await expect(indexer.reindexAll()).rejects.toThrow("ECONNREFUSED");
    });
  });
});
