import type { PrismaService } from "../../../prisma/prisma.service";

import { AssistantLog } from "./assistant-log.service";

const build = () => {
  const prisma = {
    assistantTurn: {
      create: jest.fn(() => Promise.resolve({})),
      deleteMany: jest.fn(() => Promise.resolve({ count: 3 })),
    },
  };
  return { log: new AssistantLog(prisma as unknown as PrismaService), prisma };
};

const turn = {
  conversationId: "c1",
  userId: null,
  question: "q".repeat(5000),
  answer: "a",
  hitCount: 2,
  cited: ["Rent Agreement"],
  suggestedDraft: false,
  refused: false,
  model: "claude-opus-5-5",
};

describe("AssistantLog", () => {
  it("stores the turn, counting what was recommended and capping its length", async () => {
    const { log, prisma } = build();

    await log.record(turn);

    const { data } = (
      prisma.assistantTurn.create.mock.calls[0] as unknown as [
        { data: { question: string; citedCount: number } },
      ]
    )[0];
    expect(data.question).toHaveLength(4000);
    expect(data.citedCount).toBe(1);
  });

  // The customer already has their answer.
  it("never throws", async () => {
    const { log, prisma } = build();
    prisma.assistantTurn.create.mockRejectedValue(new Error("db down"));

    await expect(log.record(turn)).resolves.toBeUndefined();
  });

  it("deletes what is older than 90 days", async () => {
    const { log, prisma } = build();
    const now = new Date("2026-10-10T00:00:00Z");

    await expect(log.purge(now)).resolves.toBe(3);

    const { where } = (
      prisma.assistantTurn.deleteMany.mock.calls[0] as unknown as [
        { where: { createdAt: { lt: Date } } },
      ]
    )[0];
    expect(where.createdAt.lt.toISOString()).toBe("2026-07-12T00:00:00.000Z");
  });
});
