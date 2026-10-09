import type { PrismaService } from "../../prisma/prisma.service";

import type { NotificationSender } from "./notification-sender.service";
import { UserNotifier } from "./user-notifier.service";

const build = (user: { email: string | null; phone: string | null } | null) => {
  const prisma = {
    user: { findUnique: jest.fn().mockResolvedValue(user) },
    notification: { create: jest.fn() },
  };
  const sender = { send: jest.fn() };
  const notifier = new UserNotifier(
    prisma as unknown as PrismaService,
    sender as unknown as NotificationSender,
  );
  return { notifier, prisma, sender };
};

const message = {
  title: "Ready",
  body: "Your document is ready",
  href: "/dashboard/documents/doc-1",
  email: {
    type: "review-ready" as const,
    payload: { customerName: null, documentTitle: "Will", documentId: "doc-1" },
  },
  sms: { template: "document-ready" as const, variables: { title: "Will" } },
};

describe("UserNotifier", () => {
  it("writes the inbox entry and sends push, email and SMS", async () => {
    const { notifier, prisma, sender } = build({
      email: "a@example.com",
      phone: "9876543210",
    });

    await notifier.notifyUser("u1", message);

    expect(prisma.notification.create).toHaveBeenCalledWith({
      data: {
        userId: "u1",
        title: "Ready",
        body: "Your document is ready",
        href: "/dashboard/documents/doc-1",
      },
    });
    const types = sender.send.mock.calls.map(
      ([job]) => (job as { type: string }).type,
    );
    expect(types).toEqual(["push", "review-ready", "sms"]);
    expect(sender.send).toHaveBeenCalledWith(
      expect.objectContaining({ type: "review-ready", to: "a@example.com" }),
    );
  });

  it("skips the channels an account has no address for", async () => {
    const { notifier, sender } = build({ email: null, phone: "9876543210" });

    await notifier.notifyUser("u1", message);

    const types = sender.send.mock.calls.map(
      ([job]) => (job as { type: string }).type,
    );
    expect(types).toEqual(["push", "sms"]);
  });

  // Every caller has already done the work worth notifying about.
  it("never throws", async () => {
    const { notifier, prisma } = build({ email: null, phone: null });
    prisma.notification.create.mockRejectedValue(new Error("db down"));

    await expect(notifier.notifyUser("u1", message)).resolves.toBeUndefined();
  });
});
