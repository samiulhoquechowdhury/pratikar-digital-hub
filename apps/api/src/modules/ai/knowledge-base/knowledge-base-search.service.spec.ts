import type { PrismaService } from "../../../prisma/prisma.service";

import {
  KnowledgeBaseSearch,
  MIN_SCORE,
} from "./knowledge-base-search.service";
import type { VoyageEmbedder } from "./voyage-embedder.service";

describe("KnowledgeBaseSearch", () => {
  const build = ({
    raw,
    templates = [],
    courses = [],
    items = [],
  }: {
    raw: {
      sourceType: string;
      sourceId: string;
      content: string;
      score: number;
    }[];
    templates?: { id: string; title: string; priceInPaise: number }[];
    courses?: { id: string; title: string; priceInPaise: number }[];
    items?: { id: string; title: string; priceInPaise: number }[];
  }) => {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue(raw),
      template: { findMany: jest.fn().mockResolvedValue(templates) },
      course: { findMany: jest.fn().mockResolvedValue(courses) },
      contentLibraryItem: { findMany: jest.fn().mockResolvedValue(items) },
    };
    const embedder = {
      isConfigured: true,
      embedQuery: jest.fn().mockResolvedValue([0.1, 0.2]),
    };
    const search = new KnowledgeBaseSearch(
      prisma as unknown as PrismaService,
      embedder as unknown as VoyageEmbedder,
    );
    return { search, prisma, embedder };
  };

  it("embeds the question as a query", async () => {
    const { search, embedder } = build({ raw: [] });

    await search.search("rent agreement for a flat");

    expect(embedder.embedQuery).toHaveBeenCalledWith(
      "rent agreement for a flat",
    );
  });

  // The index can lag an edit; price and title must be today's.
  it("takes title and price from the live row, not the index", async () => {
    const { search } = build({
      raw: [
        {
          sourceType: "template",
          sourceId: "t1",
          content: "old text",
          score: 0.6,
        },
      ],
      templates: [
        { id: "t1", title: "Rent Agreement (2026)", priceInPaise: 39900 },
      ],
    });

    const [only] = await search.search("rent");

    expect(only).toMatchObject({
      title: "Rent Agreement (2026)",
      priceInPaise: 39900,
      href: "/documents/t1",
      content: "old text",
    });
  });

  // Unpublished moments ago, still in the index until the queue catches up.
  it("drops a hit whose row is no longer published", async () => {
    const { search, prisma } = build({
      raw: [
        { sourceType: "course", sourceId: "c1", content: "x", score: 0.7 },
        { sourceType: "course", sourceId: "gone", content: "y", score: 0.6 },
      ],
      courses: [{ id: "c1", title: "GST Basics", priceInPaise: 100 }],
    });

    const hits = await search.search("gst");

    expect(hits.map((h) => h.sourceId)).toEqual(["c1"]);
    expect(prisma.course.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { in: ["c1", "gone"] }, status: "PUBLISHED" },
      }),
    );
  });

  it("drops hits below the relevance floor", async () => {
    const { search } = build({
      raw: [
        {
          sourceType: "content",
          sourceId: "i1",
          content: "x",
          score: MIN_SCORE + 0.1,
        },
        {
          sourceType: "content",
          sourceId: "i2",
          content: "y",
          score: MIN_SCORE - 0.1,
        },
      ],
      items: [
        { id: "i1", title: "Checklist", priceInPaise: 100 },
        { id: "i2", title: "Unrelated", priceInPaise: 100 },
      ],
    });

    const hits = await search.search("q");

    expect(hits.map((h) => h.sourceId)).toEqual(["i1"]);
    expect(hits[0]?.href).toBe("/content-library/i1");
  });

  it("keeps the ranking order", async () => {
    const { search } = build({
      raw: [
        { sourceType: "course", sourceId: "c1", content: "", score: 0.8 },
        { sourceType: "template", sourceId: "t1", content: "", score: 0.5 },
      ],
      templates: [{ id: "t1", title: "T", priceInPaise: 1 }],
      courses: [{ id: "c1", title: "C", priceInPaise: 1 }],
    });

    expect((await search.search("q")).map((h) => h.title)).toEqual(["C", "T"]);
  });

  it("doesn't query a table no hit points at", async () => {
    const { search, prisma } = build({ raw: [] });

    await search.search("q");

    expect(prisma.template.findMany).not.toHaveBeenCalled();
    expect(prisma.course.findMany).not.toHaveBeenCalled();
  });
});
